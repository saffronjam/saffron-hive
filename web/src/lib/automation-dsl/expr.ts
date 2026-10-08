/**
 * Reads and writes the small subset of expr-lang the automation language
 * compiles conditions to: function calls with literal arguments, an optional
 * member access, comparisons against literals, `!(…)` and `&&`.
 */

export type Literal = string | number | boolean | null | Literal[] | { [key: string]: Literal };

export type Comparator = "==" | "!=" | ">" | ">=" | "<" | "<=";

export const COMPARATORS: readonly Comparator[] = ["==", "!=", ">", ">=", "<", "<="];

/** A call such as `device("id").on` or `time.between("a", "b")`. */
export interface Call {
  fn: string;
  args: Literal[];
  member?: string;
}

/** A comparison operand: a literal or `duration("10m")`. */
export type Operand = { literal: Literal } | { duration: string };

export type Clause =
  | { kind: "call"; call: Call }
  | { kind: "compare"; call: Call; op: Comparator; right: Operand }
  | { kind: "not"; inner: ExprAst };

/** A conjunction of clauses; most expressions have exactly one. */
export interface ExprAst {
  clauses: Clause[];
}

type Token =
  | { t: "str"; v: string }
  | { t: "num"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: string };

function tokenize(source: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      while (j < source.length && source[j] !== '"') j += source[j] === "\\" ? 2 : 1;
      if (j >= source.length) return null;
      try {
        tokens.push({ t: "str", v: JSON.parse(source.slice(i, j + 1)) as string });
      } catch {
        return null;
      }
      i = j + 1;
      continue;
    }
    const number = /^-?\d+(\.\d+)?/.exec(source.slice(i));
    if (number && (c !== "-" || !tokens.length || tokens[tokens.length - 1].t === "op")) {
      tokens.push({ t: "num", v: Number(number[0]) });
      i += number[0].length;
      continue;
    }
    const ident = /^[A-Za-z_][A-Za-z0-9_]*/.exec(source.slice(i));
    if (ident) {
      tokens.push({ t: "id", v: ident[0] });
      i += ident[0].length;
      continue;
    }
    const two = source.slice(i, i + 2);
    if (["==", "!=", ">=", "<=", "&&", "||"].includes(two)) {
      tokens.push({ t: "op", v: two });
      i += 2;
      continue;
    }
    if ("(){}[],:.!<>".includes(c)) {
      tokens.push({ t: "op", v: c });
      i++;
      continue;
    }
    return null;
  }
  return tokens;
}

class Parser {
  private i = 0;
  constructor(private readonly tokens: Token[]) {}

  done(): boolean {
    return this.i >= this.tokens.length;
  }

  private peek(): Token | undefined {
    return this.tokens[this.i];
  }

  private isOp(value: string): boolean {
    const token = this.peek();
    return token?.t === "op" && token.v === value;
  }

  private expect(value: string): void {
    if (!this.isOp(value)) throw new Error(`expected ${value}`);
    this.i++;
  }

  expr(): ExprAst {
    const clauses = [this.clause()];
    while (this.isOp("&&")) {
      this.i++;
      clauses.push(this.clause());
    }
    return { clauses };
  }

  private clause(): Clause {
    if (this.isOp("!")) {
      this.i++;
      this.expect("(");
      const inner = this.expr();
      this.expect(")");
      return { kind: "not", inner };
    }
    const call = this.call();
    const token = this.peek();
    if (token?.t === "op" && (COMPARATORS as readonly string[]).includes(token.v)) {
      this.i++;
      return { kind: "compare", call, op: token.v as Comparator, right: this.operand() };
    }
    return { kind: "call", call };
  }

  private call(): Call {
    const parts = [this.ident()];
    while (this.isOp(".")) {
      this.i++;
      parts.push(this.ident());
    }
    if (!this.isOp("(")) {
      if (parts.length < 2) throw new Error("expected call");
      return { fn: parts.slice(0, -1).join("."), args: [], member: parts[parts.length - 1] };
    }
    this.i++;
    const args: Literal[] = [];
    while (!this.isOp(")")) {
      args.push(this.literal());
      if (this.isOp(",")) this.i++;
      else if (!this.isOp(")")) throw new Error("expected , or )");
    }
    this.i++;
    let member: string | undefined;
    if (this.isOp(".")) {
      this.i++;
      member = this.ident();
    }
    return { fn: parts.join("."), args, member };
  }

  private operand(): Operand {
    const token = this.peek();
    if (token?.t === "id" && token.v === "duration") {
      this.i++;
      this.expect("(");
      const value = this.literal();
      this.expect(")");
      if (typeof value !== "string") throw new Error("duration takes a string");
      return { duration: value };
    }
    return { literal: this.literal() };
  }

  private ident(): string {
    const token = this.peek();
    if (token?.t !== "id") throw new Error("expected identifier");
    this.i++;
    return token.v;
  }

  private literal(): Literal {
    const token = this.peek();
    if (!token) throw new Error("expected value");
    if (token.t === "str" || token.t === "num") {
      this.i++;
      return token.v;
    }
    if (token.t === "id") {
      this.i++;
      if (token.v === "true") return true;
      if (token.v === "false") return false;
      if (token.v === "nil") return null;
      throw new Error("expected literal");
    }
    if (token.v === "[") {
      this.i++;
      const items: Literal[] = [];
      while (!this.isOp("]")) {
        items.push(this.literal());
        if (this.isOp(",")) this.i++;
      }
      this.i++;
      return items;
    }
    if (token.v === "{") {
      this.i++;
      const object: Record<string, Literal> = {};
      while (!this.isOp("}")) {
        const key = this.peek();
        if (key?.t !== "str" && key?.t !== "id") throw new Error("expected key");
        this.i++;
        this.expect(":");
        object[String(key.v)] = this.literal();
        if (this.isOp(",")) this.i++;
      }
      this.i++;
      return object;
    }
    throw new Error("expected literal");
  }
}

/** Parses an expression in the supported subset, or returns null. */
export function parseExpr(source: string): ExprAst | null {
  const tokens = tokenize(source);
  if (!tokens || tokens.length === 0) return null;
  try {
    const parser = new Parser(tokens);
    const ast = parser.expr();
    return parser.done() ? ast : null;
  } catch {
    return null;
  }
}

/** Writes a literal in expression syntax. JSON is valid here except null. */
export function literalText(value: Literal): string {
  if (value === null) return "nil";
  if (Array.isArray(value)) return `[${value.map(literalText).join(", ")}]`;
  if (typeof value === "object") {
    return `{${Object.entries(value)
      .map(([key, item]) => `${JSON.stringify(key)}: ${literalText(item)}`)
      .join(", ")}}`;
  }
  return JSON.stringify(value);
}

export function callText(call: Call): string {
  const base =
    call.args.length > 0 || call.member === undefined
      ? `${call.fn}(${call.args.map(literalText).join(", ")})`
      : call.fn;
  return call.member === undefined ? base : `${base}.${call.member}`;
}

function operandText(operand: Operand): string {
  return "duration" in operand
    ? `duration(${JSON.stringify(operand.duration)})`
    : literalText(operand.literal);
}

function clauseText(clause: Clause): string {
  switch (clause.kind) {
    case "call":
      return callText(clause.call);
    case "compare":
      return `${callText(clause.call)} ${clause.op} ${operandText(clause.right)}`;
    case "not":
      return `!(${exprText(clause.inner)})`;
  }
}

export function exprText(ast: ExprAst): string {
  return ast.clauses.map(clauseText).join(" && ");
}
