import { authenticatedFetch } from "$lib/graphql/client";
import type { AssistantAttachment } from "$lib/gql/graphql";
import { graphql } from "$lib/gql";
export const ASSISTANT_CONVERSATION = graphql(`
  fragment AssistantConversationFields on AssistantConversation {
    id
    autoTitle
    titleOverride
    revision
    updatedAt
    forms {
      id
      runId
      title
      description
      revision
      fields {
        key
        kind
        label
        section
        description
        min
        max
        step
        options
        revision
        value {
          text
          number
          boolean
          attachmentId
        }
      }
    }
    messages {
      id
      role
      text
      attachments {
        id
        name
        mime
      }
      createdAt
      runId
    }
    actions {
      id
      runId
      status
      title
      description
      buttonLabel
      targets {
        id
        name
        href
      }
      inputs {
        path
        label
        required
      }
      needsConfirmation
      result
      hasPrivateResult
    }
    runs {
      id
      state
      activity
      error
      model
      startedAt
      finishedAt
    }
  }
`);
export const CHAT_LIST = graphql(`
  query AssistantChatList {
    assistantConversations {
      id
      autoTitle
      titleOverride
      revision
      updatedAt
    }
    claudeConfig {
      enabled
      model
      ready
    }
  }
`);
export const CHAT_GET = graphql(`
  query AssistantChatGet($id: ID!) {
    assistantConversation(id: $id) {
      ...AssistantConversationFields
    }
  }
`);
export const CHAT_WATCH = graphql(`
  subscription AssistantChatWatch($id: ID!) {
    assistantConversationChanged(id: $id) {
      ...AssistantConversationFields
    }
  }
`);
export const CHAT_CREATE = graphql(`
  mutation AssistantChatCreate {
    createAssistantConversation {
      ...AssistantConversationFields
    }
  }
`);
export const CHAT_RENAME = graphql(`
  mutation AssistantChatRename($id: ID!, $title: String!) {
    renameAssistantConversation(id: $id, title: $title) {
      ...AssistantConversationFields
    }
  }
`);
export const CHAT_DELETE = graphql(`
  mutation AssistantChatDelete($id: ID!) {
    deleteAssistantConversation(id: $id)
  }
`);
export const CHAT_SEND = graphql(`
  mutation AssistantChatSend($input: AssistantMessageInput!) {
    sendAssistantMessage(input: $input) {
      ...AssistantConversationFields
    }
  }
`);
export const CHAT_STOP = graphql(`
  mutation AssistantChatStop($id: ID!) {
    stopAssistantRun(conversationId: $id)
  }
`);
export const CHAT_RESPOND = graphql(`
  mutation AssistantChatRespond($input: AssistantActionResponseInput!) {
    respondToAssistantAction(input: $input) {
      ...AssistantConversationFields
    }
  }
`);
export const APPLICATION_CHANGED = graphql(`
  subscription ApplicationChanged {
    applicationChanged
  }
`);

export const ACTION_PRIVATE_RESULT = graphql(`
  query AssistantPrivateResult($conversationId: ID!, $actionId: ID!) {
    assistantActionPrivateResult(conversationId: $conversationId, actionId: $actionId)
  }
`);

export const CHAT_FIELD_UPDATE = graphql(`
  mutation AssistantChatUpdateField($input: AssistantFieldUpdateInput!) {
    updateAssistantField(input: $input) {
      ...AssistantConversationFields
    }
  }
`);

export async function uploadAssistantImage(
  conversationId: string,
  file: File,
): Promise<AssistantAttachment> {
  const form = new FormData();
  form.set("file", file);
  const response = await authenticatedFetch(
    `/api/assistant/attachments?conversationId=${encodeURIComponent(conversationId)}`,
    { method: "POST", body: form },
  );
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
