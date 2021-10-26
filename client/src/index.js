import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import fcose from 'cytoscape-fcose';
//cytoscape.use(dagre);
cytoscape.use(fcose);

import { generateGraphElements, generatePrereqGraphElements } from './graph.js';
import { getCourseInfo, search, getRelation, logg, execute_scraper, testDatabaseInsert, insertEclipsData,
         parseLectureSlides, pollParsedLectureSlides, insertParsedLectureSlides, sendEmail } from './api.js';
import { showLegend, showCourseInfo, showSearchResults, showCourseRelationship, hideShowSidebar } from './sidebar.js';

// TODO Don't do this (this is an async sleep function implemented without async)
function sleep(ms) {
    var start = Date.now();
	for (var i = 0; i < 1e7; i++) {
		if ((Date.now() - start) > ms){
			break;
		}
	}
}

function showCourseSimilarity(subcategories, cy) {
    const similarityGraph = document.getElementById('cy-similarity');
    const prereqGraph = document.getElementById('cy-prereqs');
    const adminPage = document.getElementById('admin-page');
    const courseSimButton = document.getElementById('showSimilarity');
    const coursePrereqsButton = document.getElementById('showPrereqs');
    const courseAdminButton = document.getElementById('showAdmin');
    coursePrereqsButton.classList.remove('is-info');
    courseSimButton.classList.add('is-info');
    courseAdminButton.classList.remove('is-info');
    prereqGraph.style.display = "none";
    similarityGraph.style.display = "block";
    adminPage.style.display = "none";
    showLegend(subcategories, cy);
    currGraph = cy;
    currGraphLegend = subcategories;
}

function showPrereqs(course_legend, cy) {
    const similarityGraph = document.getElementById('cy-similarity');
    const prereqGraph = document.getElementById('cy-prereqs');
    const adminPage = document.getElementById('admin-page');
    const courseSimButton = document.getElementById('showSimilarity');
    const coursePrereqsButton = document.getElementById('showPrereqs');
    const courseAdminButton = document.getElementById('showAdmin');
    coursePrereqsButton.classList.add('is-info');
    courseSimButton.classList.remove('is-info');
    courseAdminButton.classList.remove('is-info');
    prereqGraph.style.display = "block";
    similarityGraph.style.display = "none";
    adminPage.style.display = "none";
    showLegend(course_legend, cy);
    currGraph = cy;
    currGraphLegend = course_legend;
}

function showAdmin() {
	const similarityGraph = document.getElementById('cy-similarity');
    const prereqGraph = document.getElementById('cy-prereqs');
    const adminPage = document.getElementById('admin-page');
    const courseSimButton = document.getElementById('showSimilarity');
    const coursePrereqsButton = document.getElementById('showPrereqs');
    const courseAdminButton = document.getElementById('showAdmin');
    coursePrereqsButton.classList.remove('is-info');
    courseSimButton.classList.remove('is-info');
    courseAdminButton.classList.add('is-info');
    prereqGraph.style.display = "none";
    similarityGraph.style.display = "none";
    adminPage.style.display = "block";
}

function waitForFilesToParse(course, lecture, qid) {
	let lecture_slides_parsed = false;
	pollParsedLectureSlides(qid).then(r => {
		if (r == "201") {
			lecture_slides_parsed = true;
			getCourseInfo(course).then(course_info => {
				insertParsedLectureSlides(course_info['course_id'], lecture, qid).then(r => {
					confirmCourseUploadSuccess(course_info['course_code'], lecture)
				})
			})
		} else {
			setTimeout(function() {waitForFilesToParse(course, lecture, qid);}, 20000)
		}
	})
}

function waitUploadFiles(files, i, course) {
	let lecture_no = i;
	if (i < files.length) {
		parseLectureSlides(files[i], course, lecture_no).then(qid => {
			waitForFilesToParse(course, lecture_no, qid);
			setTimeout(function() {waitUploadFiles(files, i+1, course);}, 2000)
		})
	}
}

function uploadFiles() {
	const slideUploadConfirmationText = document.getElementById('slideUploadConfirmationText');
	const files_to_upload = document.getElementById('lectureSlideUploads');
	const courseCode = document.getElementById('courseVerifierInput');
	let files = files_to_upload.files;
	let course = courseCode.value;
	slideUploadConfirmationText.innerHTML = "Uploading "+files.length+" lecture slides for "+course+".<br />This may take a minute."+
	                                        " Confirmation of your uploads will appear below.<br />"
	waitUploadFiles(files, 0, course);
}

function verifyCourse() {
    const courseVerifier = document.getElementById('courseVerifier');
    const courseVerifierResultText = document.getElementById('verifySlidesResultText');
    const courseCode = document.getElementById('courseVerifierInput');
    getCourseInfo(courseCode.value).then(course_info => {
    	console.log("Verified: "+course_info['course_name']+": "+course_info['course_id'])
		if (course_info['course_name'] != undefined) {
			courseVerifierResultText.innerHTML = "You are submitting lecture slides for "+course_info['course_code']+": "+course_info['course_name']+".";
			courseVerifier.style.display = "block";
		} else {
		    courseVerifierResultText.innerHTML = "Course does not exist.";
		    courseVerifier.style.display = "none";
		}
    })
}

function confirmCourseUploadSuccess(course, lecture_no) {
	const slideUploadConfirmationText = document.getElementById('slideUploadConfirmationText');
	slideUploadConfirmationText.innerHTML += "Lecture no."+lecture_no+" from "+course+" successfully uploaded.<br />";
}

function OrNodeOrNot(a, b) {
    return (ele) => {
        return ele.data('or_node') ? a : b;
    };
}

function highlightCourse(courseNode, cy) {
    // when a course is typed in, light it up!
    // cy.elements().not(courseNode).addClass('semitransp').addClass('semitransp');
    // console.log('dsf');
    // courseNode.addClass('highlight');
    courseNode.animate({
        style: { 'border-width': '2px', 'border-color': 'black' },
    }, {
        duration: 0
    })
}

function sendTestEmail() {
	sendEmail("andrew@trouty.com", "It worked!", "Yeet yeet");
}


var currGraph;
export var currGraphLegend;

function getCurrGraphName() {
    return currGraph._private.data.name;
}

(function main() {
    const subcategories_colours = [
        ['Algorithms and data structures', '#e6194b', 'ads'], // red
        ['Computer architecture', '#f58231', 'comparch'], //orange
        ['Formal methods', '#ffe119', 'fm'], //yellow 
        ['Computer security', '#3cb44b', 'sec'], // green 
        ['Artificial intelligence', '#4363d8', 'ai'], //blue
        ['Computational science', '#911eb4', 'cs'], // purp 
        ['Computer graphics', '#a9a9a9', 'graphics'], //grey 
        ['Database theory', '#000000', 'db'], //black
        ['Concurrency', '#9a6324', 'conc'] //brown
    ];
    const course_level_colours = [
        ['Level 1 course', '#8ac793'],
        ['Level 2 course', '#9eacdf'],
        ['Level 3 course', '#fff08e'],
        ['Level 4 course', '#f2c7a8'],
        ['Level 6 course', '#ea9eb0'],
        ['Level 9 course', '#d994ed'],
    ]
    const edge_weight_threshold = 0;
    const showCourseSimilarityButton = document.getElementById('showSimilarity');
    const showPrereqsButton = document.getElementById('showPrereqs');
    const showAdminButton = document.getElementById('showAdmin');
    const fileUploadButton = document.getElementById('uploadSlides');
    const verifyButton = document.getElementById('verifySlidesButton');
    const emailButton = document.getElementById('sendEmail');
    
    // To re-enable any commented-out buttons, uncomment them here and in index.html
    //insertEclipsDataButton.addEventListener('click', insertEclipsData);
    //executeEclips.addEventListener('click', execute_scraper);
    toggleSidebar.addEventListener('click', hideShowSidebar);
    fileUploadButton.addEventListener('click', uploadFiles);
    verifyButton.addEventListener('click', verifyCourse);
    //emailButton.addEventListener('click', sendTestEmail);


    const displayEdgeInfoSidebar = edge => {
        const targetEdge = edge.target;
        const edgeName = edge.target._private.data.id.slice(0, 16);
        const courseA = targetEdge._private.data.source;
        const courseB = targetEdge._private.data.target;
        getRelation(courseA, courseB).then(relationship_info => {
            logg(`Showing course relation between ${courseA} and ${courseB}.`);
            showCourseRelationship(courseA, courseB, relationship_info, subcategories_colours, edgeName, currGraph);
        })
    }

    Promise.all([generateGraphElements(), generatePrereqGraphElements()]).then(graphs_elements => {

        const similarityGraphElements = graphs_elements[0][0].filter(ele => !ele.data.weight || ele.data.weight > 0);
        const similarityGraphColouredNodes = graphs_elements[0][1];
        const similarityGraph = cytoscape({
            container: document.getElementById('cy-similarity'),
            elements: similarityGraphElements,
            style: [ // the stylesheet for the graph
                {
                    selector: 'node',
                    style: {
                        'background-color': ele => {
                            const courseLinks = similarityGraphColouredNodes[ele.data('id')]
                            const highest_subcat = Object.keys(courseLinks).reduce((a, b) => courseLinks[a] > courseLinks[b] ? a : b);
                            return subcategories_colours.find(ele => ele[0] === highest_subcat)[1];
                        },
                        'color': 'white',
                        'label': ele => ele.data('id').slice(0, 4) + '\n' + ele.data('id').slice(4, 8),
                        'width': '60px',
                        'height': '60px',
                        "text-valign": "center",
                        "text-halign": "center",
                        "text-wrap": "wrap",
                    }
                },
                {
                    selector: 'node.highlight',
                    style: {
                        'border-color': 'black',
                        'border-width': '2px'
                    }
                },
                {
                    selector: 'node.semitransp',
                    style: { 'opacity': '0.5' }
                },
                {
                    selector: 'edge',
                    style: {
                        // 'width': 'mapData(weight, 0, 100, 1, 10)',
                        'width': `mapData(weight, ${edge_weight_threshold}, 200, 1, 10)`,
                        'line-color': ele => subcategories_colours.find(ele2 => ele2[0] == ele.data('subcat'))[1],
                        'curve-style': 'bezier'
                    }
                }
            ],
            layout: {
                name: 'circle',
            }
        });

        similarityGraph._private.data['name'] = 'similarity';
        currGraph = similarityGraph;
        const displayCourseInfoSidebar = node => {
            logg(`Clicked on graph node in graph ${getCurrGraphName()}`);
            const targetNode = node.target;
            getCourseInfo(targetNode._private.data.id).then(course_info => {
                showCourseInfo(course_info, currGraph);
            })
        };

        similarityGraph.nodes().on('click', displayCourseInfoSidebar);
        similarityGraph.edges().on('click', displayEdgeInfoSidebar);
        similarityGraph.on('mouseover', 'node', function(e) {
            highlightCourse(e.target, similarityGraph);
        });
        similarityGraph.on('mouseout', 'node', function(e) {
            var sel = e.target;
            similarityGraph.elements().removeClass('semitransp');
            sel.animate({
                style: { 'border-width': '0px', 'border-color': 'black' },
            }, {
                duration: 0
            });
        });

        similarityGraph.edges().filter((e) => {
            return e.width() * 10 < 25;
        }).style('display', 'none');
        
        // Get a list of all roots of the prereq graph
        let prereq_elements = graphs_elements[1];
        let prereq_roots = [];
        let prereq_singles = [];
        let prereq_levels = [[], [], [], [], [], [], [], []];
        for (let i = 0; i < prereq_elements.length; i++) {
    		if (prereq_elements[i].data.is_root && prereq_elements[i].data.is_leaf) {
    			prereq_singles.push(prereq_elements[i].data.id);
    		} else if (prereq_elements[i].data.is_course) {
    			//prereq_levels[0].push(prereq_elements[i].data.id);
    			prereq_levels[prereq_elements[i].data.level].push(prereq_elements[i].data.id);
    		}
        }
        for (let i = 0; i < prereq_levels.length; i++) {
        	if (prereq_levels[i].length <= 1) {
        		prereq_levels.splice(i, 1);
        		i--;
        	}
        }
        let level_separators = [{top: prereq_singles[0], bottom: prereq_levels[0][0], gap: 200}];
        for (let i = 0; i < prereq_levels.length-1; i++) {
        	level_separators.push({top: prereq_levels[i][0], bottom: prereq_levels[i+1][0], gap: 200});
        }
        

        const prereqsGraph = cytoscape({
            container: document.getElementById('cy-prereqs'),
            elements: graphs_elements[1],
            style: [ // the stylesheet for the graph
                {
                    selector: 'node',
                    style: {
                        'background-color': ele => {
                            return ele.data('or_node') ? 'black' :
                                course_level_colours.find(lvl => 'Level ' + ele.data('id').charAt(4) + ' course' === lvl[0])[1];
                        },
                        'label': ele => ele.data('or_node') ? '' : ele.data('id').slice(0, 4) + '\n' + ele.data('id').slice(4, 8),
                        'width': OrNodeOrNot('15px', '80px'),
                        'height': OrNodeOrNot('15px', '80px'),
                        'shape': OrNodeOrNot('round-diamond', 'ellipse'),
                        "text-valign": "center",
                        "text-halign": "center",
                        "text-wrap": "wrap",
                        "color": ele => {
                            return "black"; // todo: complement colour of bg colour
                            // return ele.data('or_node') ? 'black' :
                            //     course_level_colours.find(lvl => 'Level ' + ele.data('id').charAt(4) + ' course' === lvl[0])[1];
                        }
                    }
                },
                {
                    selector: 'node.highlight',
                    style: {
                        'border-color': 'black',
                        'border-width': '2px'
                    }
                },
                {
                    selector: 'node.semitransp',
                    style: { 'opacity': '0.5' }
                },
                {
                    selector: 'edge',
                    style: {
                        // 'width': 'mapData(weight, 0, 100, 1, 10)',
                        'width': '3px',
                        'curve-style': 'straight',
                        'target-arrow-shape': 'vee',
                        'target-arrow-color': ele => {
                            // ele.data('to_or_node') ? '#000000' : 'grey',
                            if (ele.data('target').slice(ele.data('target').length - 2) === 'or') {
                                return 'silver';
                            }
                            return '#202020';
                        },
                        'line-color': ele => {
                            // ele.data('to_or_node') ? '#000000' : 'grey',
                            if (ele.data('target').slice(ele.data('target').length - 2) === 'or') {
                                return 'silver';
                            }
                            return '#202020';
                        }
                    }
                }
            ],
            layout: {
                name: 'fcose',
                nodeSeparation: 75,
                alignmentConstraint: {horizontal: [...prereq_levels, prereq_singles]},
                relativePlacementConstraint: level_separators
            }
        });
        prereqsGraph._private.data['name'] = 'prerequisites';

        // TODO: Easy way of sharing these events for both graphs
        prereqsGraph.on('mouseover', 'node', function(e) {
            highlightCourse(e.target, prereqsGraph);
            logg(`Highlighted course prerequisites.`);
            // You can set the border-color and width to something meaningful here
            e.target.predecessors().animate({
                style: {
                    lineColor: 'red',
                    'target-arrow-color': 'red',
                    'border-color': 'brown',
                    'border-width': '5px'
                },

            });
        });
        prereqsGraph.on('mouseout', 'node', function(e) {
            var sel = e.target;
            prereqsGraph.elements().removeClass('semitransp');
            sel.animate({
                style: { 'border-width': '0px', 'border-color': 'black' },
            }, {
                duration: 0
            });

            e.target.predecessors().forEach((edge) => {
                if (edge.isEdge()) {
                    const orig_colour = (edge.data('target').slice(edge.data('target').length - 2) === 'or') ? 'silver' : '#202020';
                    edge.animate({
                        style: { lineColor: orig_colour, 'target-arrow-color': orig_colour },
                    });
                } else {
                    edge.animate({
                        style: { 'border-width': '0px', 'border-color': 'black' },
                    });
                }

            })


        });
        prereqsGraph.nodes().on('click', displayCourseInfoSidebar);

        showCourseSimilarity(subcategories_colours, similarityGraph);
        const searchField = document.getElementById('graphSearch');
        searchField.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                const reg = /([A-Z]{4}[0-9]{4})/;
                const courseSearch = reg.exec(event.target.value);
                if (courseSearch) {
                    const courseNode = currGraph.getElementById(courseSearch[0].toUpperCase());
                    if (courseNode.empty()) {
                        return;
                    }
                    logg(`Searched for course ${event.target.value.length} in graph ${getCurrGraphName()}`);

                    // console.log(courseNode);
                    highlightCourse(courseNode, currGraph);
                    currGraph.elements().not(courseNode).addClass('semitransp').addClass('semitransp');
                    // currGraph.zoom({
                    //     level: 2.0, // the zoom level
                    //     renderedPosition: { x: 100, y: 100 }
                    // });
                    // console.log(courseNode._private.position)
                    currGraph.animate({
                        zoom: {
                            level: 1.0,
                            position: courseNode.position()
                        }
                    });
                } else {
                    const searchKey = searchField.value.split(" ").join(",");
                    search(searchKey).then(
                        search_response => {
                            logg(`Searching for: ${searchKey} in graph ${getCurrGraphName()}.`);
                            showSearchResults(searchField.value, search_response, currGraph);
                        }
                    )
                }
            }

        });
        showCourseSimilarityButton.addEventListener('click', _ => {
		    logg("Clicked on course similarity button");
		    showCourseSimilarity(subcategories_colours, similarityGraph);
		}, false);
		showPrereqsButton.addEventListener('click', _ => {
		    logg("Clicked on prereq graph button");
		    showPrereqs(course_level_colours, prereqsGraph);
		}, false);
		showAdminButton.addEventListener('click', _ => {
		    logg("Clicked on admin button");
		    showAdmin();
		}, false);
    })
})()
