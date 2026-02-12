#import "template.typ": template
#import "cfg.typ": cfg
#import "data.typ": data
#import "list.typ": *

#show: body => template(cfg: cfg(data), body)

#include "body.typ"
