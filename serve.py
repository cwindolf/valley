from jinja2 import Template
from http.server import HTTPServer, SimpleHTTPRequestHandler

IN  = 'valley.tmpl'
OUT = 'valley.html'

js_files = ('main',)
shaders  = ('reactfrag', 'terrainvert', 'terrainfrag')

class JustWantToRenderThisOneTemplateHandler(SimpleHTTPRequestHandler):

    def do_GET(self):
        if self.path.endswith(OUT):
            files = {}
            for s in js_files:
                with open(s + '.js', 'r') as f:
                    files[s] = f.read()
            for s in shaders:
                with open(s + '.glsl', 'r') as f:
                    files[s] = f.read()
            with open(IN, 'r') as t:
                template = Template(t.read())
            self.send_response(200)
            self.end_headers()
            self.wfile.write(template.render(**files).encode())
        else:
            super().do_GET()

httpd = HTTPServer(('', 80), JustWantToRenderThisOneTemplateHandler)
httpd.serve_forever()
