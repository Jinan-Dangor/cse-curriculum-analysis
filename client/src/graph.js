import { getGraphData, getPrereqs } from './api.js';

export function generateGraphElements() {
    return getGraphData().then(
        (graph_data) => {
            const courses = graph_data.nodes;
            const edges = graph_data.edges;
            let elements = courses.map(course_name => {
                return {
                    data: {
                        id: course_name
                    }
                }
            });
            const colour_course = {};
            courses.forEach(c => {
                colour_course[c] = {}
                graph_data.subcategories.forEach(s => {
                    colour_course[c][s] = 0;
                })
            })
            courses.forEach(
                (course) => {
                    if (course in edges) {
                        Object.keys(edges[course]).forEach(
                            neighbour => {
                                Object.keys(edges[course][neighbour]).forEach(
                                    subcategory => {
                                        const edge = {
                                            data: {
                                                id: course + neighbour + subcategory,
                                                source: course,
                                                target: neighbour,
                                                subcat: subcategory,
                                                weight: edges[course][neighbour][subcategory]
                                            }
                                        };
                                        colour_course[course][subcategory] += edges[course][neighbour][subcategory];
                                        colour_course[neighbour][subcategory] += edges[course][neighbour][subcategory];
                                        elements.push(edge);
                                    }
                                )
                            }
                        )
                    }

                }
            )
            return [elements, colour_course];
        }
    )
}

function getSrc(prereqs) {
    if (prereqs.length === 0) {
        console.log('shouldnt reach here');
        return null;
    }
    if (prereqs.length === 1) {
        return prereqs[0].data.source;
    }

    if (prereqs[0].data.or_node) {
        return prereqs[0].data.id;
    }

    return null;
}

function buildEdge(id, source, target) {
    return {
        data: {
            id: id,
            source: source,
            target: target
        }
    }
}

function buildNode(id, or_node = false) {
    return {
        data: {
            id: id,
            or_node: or_node,
            level: 0
        }
    }
}

function parsePrereqs(main_course, handbook_prereqs, prereqs) {
    if (!Array.isArray(prereqs)) {
        // just 1 prereq
        const neighbour = Object.keys(prereqs)[0];
        return [buildEdge(neighbour + main_course, neighbour, main_course)];
    }

    const operation = prereqs[0];
    if (operation === 'AND') {
        const c1 = parsePrereqs(main_course, handbook_prereqs, prereqs[1]);
        const c2 = parsePrereqs(main_course, handbook_prereqs, prereqs[2]);
        const c1_src = getSrc(c1);
        const c2_src = getSrc(c2);
        const c1_to_main = buildEdge(main_course + c1_src, c1_src, main_course);
        const c2_to_main = buildEdge(main_course + c2_src, c2_src, main_course);
        return [
            ...(c1_src !== null ? [c1_to_main] : []),
            ...(c2_src !== null ? [c2_to_main] : []),
            ...c1, ...c2
        ];
    } else if (operation === 'OR') {
        // create new "OR" node if doesn't exist
        if (main_course.slice(main_course.length - 2) !== 'or') {
            const or_node_id = main_course + 'or';
            const or_node = buildNode(or_node_id, true);
            const or_node_edge_to_main = buildEdge(or_node_id + main_course, or_node_id, main_course);
            const c1 = parsePrereqs(or_node_id, handbook_prereqs, prereqs[1]);
            const c2 = parsePrereqs(or_node_id, handbook_prereqs, prereqs[2]);
            return [or_node, or_node_edge_to_main, ...c1, ...c2];
        } else {
            // or node already exists
            const c1 = parsePrereqs(main_course, handbook_prereqs, prereqs[1]);
            const c2 = parsePrereqs(main_course, handbook_prereqs, prereqs[2]);
            const new_c1 = c1.map(c11 => {
                return buildEdge(c11.data.id, c11.data.source, main_course);
            });
            const new_c2 = c2.map(c22 => {
                return buildEdge(c22.data.id, c22.data.source, main_course);
            });
            return [...new_c1, ...new_c2, ...c1, ...c2];
        }
    } else if (operation === 'WITH') {
        const c1 = parsePrereqs(main_course, handbook_prereqs, prereqs[1]);
        // todo: not extensible if coreq is an OR/AND
        const new_c1 = buildEdge(c1[0].data.id, c1[0].data.source, main_course);
        return [new_c1, ...c1];
    }
}

//TODO: Make work when two things on the same level are prerequisities (whether they progress to the next level depends on order?)
// This might be some other problem, theoretically I don't think it makes sense
function setLevel(elements, num_nodes) {
	let num_edges = elements.length-num_nodes;
	for (let i = 0; i < num_nodes; i++) {
		if (elements[i].data.is_root) {
			elements[i].data.level = 0;
		}
	}
	let current_level = 1;
	let change_made = true;
	while (change_made) {
		change_made = false;
		for (let i = 0; i < elements.length; i++) {
			if ((elements[i].data.is_course && elements[i].data.level == current_level-1) ||
			    (elements[i].data.or_node   && elements[i].data.level == current_level-2)) {
				for (let j = num_nodes; j < num_nodes+num_edges; j++) {
					if (elements[j].data.source == elements[i].data.id) {
						for (let k = 0; k < num_nodes; k++) {
							if (elements[k].data.id == elements[j].data.target) {
								if (elements[k].data.or_node) {
									elements[k].data.level = Math.max(current_level-1, elements[k].data.level);
								} else {
									elements[k].data.level = Math.max(current_level,   elements[k].data.level);
								}
								change_made = true;
							}
						}
					}
				}
			}
		}
		current_level++;
	}
	return elements;
}

export function generatePrereqGraphElements() {
    return getPrereqs().then(graph_data => {
        const courses = Object.keys(graph_data);
        let elements = courses.map(course_name => {
            return {
                data: {
                    id: course_name,
                    is_course: true,
                    is_root: Object.keys(graph_data[course_name]['prereqs'] ? graph_data[course_name]['prereqs'] : {}).length === 0,
                    is_leaf: true,
                    level: -1
                }
            }
        });
        const num_nodes = elements.length;
        courses.forEach(course => {
            const handbook_prereqs = graph_data[course]['handbook_prereqs'];
            const prereqs = graph_data[course]['prereqs'] ? graph_data[course]['prereqs'] : {};

            if (Object.keys(prereqs).length === 0) {
                return;
            }
            
            const parsedPrereqs = parsePrereqs(course, handbook_prereqs, prereqs);

            elements = [...elements, ...parsedPrereqs];
            
            for (let i = 0; i < parsedPrereqs.length; i++) {
            	for (let j = 0; j < num_nodes; j++) {
            		if (!parsedPrereqs[i].data.or_node && parsedPrereqs[i].data.source == elements[j].data.id) {
		        		elements[j].data.is_leaf = false;
		        		break;
		        	}
            	}
            	
            }
        });
        return setLevel(elements, num_nodes);
    })
}
