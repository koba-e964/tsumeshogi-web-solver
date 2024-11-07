.PHONY: all
all: dependency_graph.png

%.png: %.dot
	dot -Tpng $< -o $@
