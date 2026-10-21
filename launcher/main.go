// NUTBUSTER standalone offline desktop launcher.
// The release builder stages the web game under launcher/web for embedding.
package main

import (
    "embed"
    "io"
    "flag"
    "fmt"
    "io/fs"
    "log"
    "net"
    "net/http"
    "os"
    "os/exec"
    "runtime"
    "time"
)

//go:embed web
var content embed.FS

func main() {
    noBrowser := flag.Bool("no-browser", false, "do not open the default browser (smoke tests)")
    flag.Parse()
    files, err := fs.Sub(content, "web")
    if err != nil { log.Fatal(err) }
    for _, required := range []string{"index.html", "engine.js", "game.js", "audio.js", "art/primary/nuts/peanut.png"} {
        if _, err = fs.Stat(files, required); err != nil { log.Fatalf("Game archive missing %s: %v", required, err) }
    }
    const address = "127.0.0.1:43823" // Fixed origin preserves browser-local save files across launches.
    listener, err := net.Listen("tcp", address)
    if err != nil {
        // A second invocation is allowed only if this is another NUTBUSTER instance.
        client := &http.Client{Timeout: 900 * time.Millisecond}
        resp, checkErr := client.Get("http://" + address + "/__nutbuster_ping")
        if checkErr == nil {
            body, _ := io.ReadAll(io.LimitReader(resp.Body, 128))
            resp.Body.Close()
            if resp.StatusCode == http.StatusOK && string(body) == "NUTBUSTER_OFFLINE_V1" {
                fmt.Println("NUTBUSTER is already running. Opening existing game.")
                if !*noBrowser { openBrowser("http://" + address + "/") }
                return
            }
        }
        log.Fatalf("NUTBUSTER port %s is occupied by another program; close it before playing: %v", address, err)
    }
    mux := http.NewServeMux()
    mux.HandleFunc("/__nutbuster_ping", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "text/plain")
        _, _ = w.Write([]byte("NUTBUSTER_OFFLINE_V1"))
    })
    mux.Handle("/", http.FileServer(http.FS(files)))
    server := &http.Server{Handler:mux, ReadHeaderTimeout:5*time.Second}
    url := "http://" + address + "/"
    fmt.Printf("NUTBUSTER ready: %s\nGame files are embedded; Internet is not required.\nClose this window to stop the server.\n", url)
    go func(){if e:=server.Serve(listener);e!=nil&&e!=http.ErrServerClosed{log.Print(e)}}()
    if !*noBrowser {openBrowser(url)}
    // Keep running until the user exits; local web app must remain available to load audio and artwork.
    select{}
}
func openBrowser(url string) {
    var cmd *exec.Cmd
    switch runtime.GOOS {
    case "windows": cmd=exec.Command("rundll32.exe", "url.dll,FileProtocolHandler", url)
    case "darwin": cmd=exec.Command("open", url)
    default: cmd=exec.Command("xdg-open", url)
    }
    if err:=cmd.Start(); err!=nil {fmt.Fprintf(os.Stderr,"Could not automatically open the browser: %v\nOpen the printed address manually.\n",err)}
}
