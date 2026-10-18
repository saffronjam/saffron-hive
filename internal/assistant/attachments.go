package assistant

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"image"
	"image/color"
	"image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/store"
	"golang.org/x/image/draw"
	_ "golang.org/x/image/webp"
)

const MaxAttachmentBytes = 1 << 20

func normalizeImage(content []byte) ([]byte, error) {
	config, format, err := image.DecodeConfig(bytes.NewReader(content))
	if err != nil {
		return nil, errors.New("choose a JPEG, PNG or WebP image")
	}
	if format != "jpeg" && format != "png" && format != "webp" || config.Width <= 0 || config.Height <= 0 || int64(config.Width)*int64(config.Height) > 40_000_000 {
		return nil, errors.New("image format or dimensions are unsupported")
	}
	source, _, err := image.Decode(bytes.NewReader(content))
	if err != nil {
		return nil, errors.New("could not decode the image")
	}
	w, h := config.Width, config.Height
	for max(w, h) > 1536 {
		w = max(1, w/2)
		h = max(1, h/2)
	}
	for {
		dest := image.NewRGBA(image.Rect(0, 0, w, h))
		draw.Draw(dest, dest.Bounds(), image.NewUniform(color.White), image.Point{}, draw.Src)
		draw.CatmullRom.Scale(dest, dest.Bounds(), source, source.Bounds(), draw.Over, nil)
		var buf bytes.Buffer
		if err := jpeg.Encode(&buf, dest, &jpeg.Options{Quality: 85}); err != nil {
			return nil, err
		}
		if buf.Len() <= MaxAttachmentBytes {
			return buf.Bytes(), nil
		}
		w = max(1, w/2)
		h = max(1, h/2)
	}
}

func (s *Service) AttachmentHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p, err := principal(r.Context())
		if err != nil || s.check(r.Context(), p) != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		id := strings.TrimPrefix(r.URL.Path, "/api/assistant/attachments/")
		if r.Method == http.MethodGet {
			a, err := s.store.GetAssistantAttachment(r.Context(), id, p.ID)
			if err != nil {
				http.NotFound(w, r)
				return
			}
			w.Header().Set("Content-Type", a.MIME)
			w.Header().Set("Cache-Control", "private, no-store")
			w.Header().Set("X-Content-Type-Options", "nosniff")
			_, _ = w.Write(a.Content)
			return
		}
		if r.Method == http.MethodDelete {
			if err := s.store.DeleteAssistantAttachment(r.Context(), id, p.ID); err != nil {
				http.Error(w, "could not delete attachment", 500)
				return
			}
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		conversationID := r.URL.Query().Get("conversationId")
		if _, err := s.Get(r.Context(), conversationID); err != nil {
			http.NotFound(w, r)
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, 26<<20)
		if err := r.ParseMultipartForm(26 << 20); err != nil {
			http.Error(w, "image must be smaller than 25 MB", 400)
			return
		}
		defer func() {
			if r.MultipartForm != nil {
				_ = r.MultipartForm.RemoveAll()
			}
		}()
		file, header, err := r.FormFile("file")
		if err != nil {
			http.Error(w, "choose an image", 400)
			return
		}
		defer func() { _ = file.Close() }()
		content, err := io.ReadAll(io.LimitReader(file, (25<<20)+1))
		if err != nil || len(content) > 25<<20 {
			http.Error(w, "image must be smaller than 25 MB", 400)
			return
		}
		normalized, err := normalizeImage(content)
		if err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		name := []rune(header.Filename)
		if len(name) > 200 {
			name = name[:200]
		}
		a := store.AssistantAttachment{ID: uuid.NewString(), ConversationID: conversationID, Name: string(name), MIME: "image/jpeg", Content: normalized}
		if err := s.store.CreateAssistantAttachment(r.Context(), a); err != nil {
			http.Error(w, "could not save image", 500)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(Attachment{a.ID, a.Name, a.MIME})
	})
}

func (s *Service) photo(ctx context.Context, userID, conversationID, id string) (string, error) {
	a, err := s.store.GetAssistantAttachment(ctx, id, userID)
	if err != nil || a.ConversationID != conversationID {
		return "", errors.New("attachment is unavailable")
	}
	source, _, err := image.Decode(bytes.NewReader(a.Content))
	if err != nil {
		return "", err
	}
	bounds := source.Bounds()
	size := min(bounds.Dx(), bounds.Dy())
	crop := image.Rect(bounds.Min.X+(bounds.Dx()-size)/2, bounds.Min.Y+(bounds.Dy()-size)/2, bounds.Min.X+(bounds.Dx()+size)/2, bounds.Min.Y+(bounds.Dy()+size)/2)
	dest := image.NewRGBA(image.Rect(0, 0, 128, 128))
	draw.CatmullRom.Scale(dest, dest.Bounds(), source, crop, draw.Src, nil)
	rgb := make([]byte, 0, 128*128*3)
	for y := 0; y < 128; y++ {
		for x := 0; x < 128; x++ {
			c := dest.RGBAAt(x, y)
			rgb = append(rgb, c.R, c.G, c.B)
		}
	}
	b, err := json.Marshal(struct {
		Width  int    `json:"width"`
		Height int    `json:"height"`
		RGB    string `json:"rgbBase64"`
	}{128, 128, base64.StdEncoding.EncodeToString(rgb)})
	return string(b), err
}
