package api

import "net/http"

type Api struct {
	server *http.Server
}

type ApiHandler struct {}

func NewApi(addr string) *Api {
	serveHandler := ApiHandler{}
	
	serveMux := http.NewServeMux()
	serveMux.HandleFunc("/format", serveHandler.format)
	serveMux.HandleFunc("/apply", serveHandler.apply)
	
	return &Api{
		server: &http.Server{
			Addr: addr,
			Handler: serveMux,
		},
	}
}

func (a *Api) Serve() error {
	return a.server.ListenAndServe()
}
