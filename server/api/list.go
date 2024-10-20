package api

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/megakuul/conditional-access-automator/server/engine"
)

type listResponse struct {
	Templates []string `json:"templates"`
}

func (h *ApiHandler) list(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	accessTokenCookie, err := r.Cookie("access_token")
	if err != nil {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	policies, err := h.adapter.FetchPolicies(accessTokenCookie.Value)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte(fmt.Sprintf("failed to fetch policies: %v", err)))
		return
	}

	res := listResponse{}

	for _, policy := range *policies {
		tmpl, err := engine.ParseAzureTemplate(policy)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Header().Add("Content-Type", "text/plain")
			w.Write([]byte(fmt.Sprintf("failed to parse policy: %v", err)))
			return
		}

		jsonTmpl, err := engine.SerializeTemplate(tmpl, "json", h.emergencyAccount)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Header().Add("Content-Type", "text/plain")
			w.Write([]byte(fmt.Sprintf("failed to serialize policy: %v", err)))
			return
		}

		baseJsonTmpl := make([]byte, base64.URLEncoding.EncodedLen(len(jsonTmpl)))
		base64.URLEncoding.Encode(baseJsonTmpl, jsonTmpl)
		res.Templates = append(res.Templates, string(baseJsonTmpl))
	}

	resRaw, err := json.Marshal(&res)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Header().Add("Content-Type", "text/plain")
		w.Write([]byte(fmt.Sprintf("failed to serialize response: %v", err)))
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Add("Content-Type", "application/json")
	w.Write(resRaw)
}
