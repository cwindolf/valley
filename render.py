from jinja2 import Template
import logging


IN  = 'valley.tmpl'
OUT = 'valley.html'

files = {}
for s in ():
    with open(s, 'r') as f:
        files[s] = f.read()

with open(IN, 'r') as t:
    template = Template(t.read())

with open(OUT, 'w') as o:
    o.write(template.render(**files))
