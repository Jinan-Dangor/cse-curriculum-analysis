import { currGraphLegend } from './index.js';
import { unlikeRelation, undislikeRelation, likeRelation, dislikeRelation, getCoursesInfo, logg,
         getCourseLectureKeywords,
         insertAssumedKnowledge, getAssumedKnowledgeKeywords, getAllLectureKeywords, clearAssumedKnowledge } from './api.js';

function getCurrGraphName(currGraph) {
    return currGraph._private.data.name;
}

export function showLegend(items, currGraph) {
    clearSidebar();

    const divLegend = document.createElement('div');
    const h3Legend = document.createElement('h3');
    h3Legend.classList.add('title');
    h3Legend.appendChild(document.createTextNode('Legend'));
    const h5Legend = document.createElement('h5');
    h5Legend.innerHTML = '<b>Click on the squares to filter:</b>';

    const ulLegend = document.createElement('ul');
    ulLegend.classList.add('ordering');

    items.forEach(item => {
        const li = document.createElement('li');
        const colour_block = document.createElement('span');
        colour_block.style['background'] = item[1];
        colour_block.addEventListener('click', () => {
            if (getCurrGraphName(currGraph) === 'similarity') {
                // currGraph.filter(ele => !(ele._private.data.subcat !== item[0])).style('display', '');
                // currGraph.filter(ele => !ele.isNode() && ele._private.data.subcat !== item[0]).style('display', 'none');
                const currThreshold = parseInt(document.querySelector('#slider-output').innerText)
                currGraph.edges().filter((e) => {
                    return e._private.data.subcat === item[0] && e.width() * 10 >= currThreshold;
                }).style('display', '');
                currGraph.edges().filter((e) => {
                    return !(e._private.data.subcat === item[0] && e.width() * 10 >= currThreshold);
                }).style('display', 'none');

            }
        })
        li.appendChild(colour_block);
        li.appendChild(document.createTextNode(item[0]));
        ulLegend.appendChild(li);
    });

    divLegend.appendChild(h3Legend);
    if (getCurrGraphName(currGraph) === 'similarity') {
        divLegend.appendChild(h5Legend);
    }

    const slider = document.createElement('div');
    slider.classList.add('buttons', 'is-centered');
    slider.style.marginBottom = '0px';
    const theSlider = document.createElement('input');
    theSlider.id = 'threshold-slider';
    theSlider.classList.add('slider', 'has-output', 'is-fullwidth')
    const defaultVal = '25';
    theSlider.min = '0';
    theSlider.max = '100';
    theSlider.value = defaultVal;
    theSlider.step = '1';
    theSlider.type = 'range';
    slider.appendChild(theSlider);
    const sliderRes = document.createElement('output');
    sliderRes.id = 'slider-output';
    sliderRes.innerText = defaultVal;
    slider.addEventListener('input', () => {
        sliderRes.innerText = theSlider.value;
        if (getCurrGraphName(currGraph) === 'similarity') {
            currGraph.edges().filter((e) => {
                return e.width() * 10 <= parseInt(theSlider.value);
            }).style('display', 'none');
            //above
            currGraph.edges().filter((e) => {
                return e.width() * 10 >= parseInt(theSlider.value);
            }).style('display', '');
        }
    })
    const div2 = document.createElement('div');
    div2.classList.add('buttons', 'is-centered');
    div2.appendChild(sliderRes);
    // slider.appendChild(document.createElement('br'))
    // slider.appendChild(sliderRes);

    divLegend.appendChild(ulLegend);

    if (getCurrGraphName(currGraph) === 'similarity') {
        divLegend.appendChild(document.createElement('br'));
        divLegend.appendChild(slider);
        divLegend.appendChild(div2);
    }
    addToSidebar(divLegend, false, null);
    addToSidebar(document.createElement('hr'), false, null);
    showFilteringOptions(currGraph);
}

export function showCourseInfo(course_info, currGraph) {
    clearSidebar();

    const divCI = document.createElement('div');
    const h3CI = document.createElement('h3');
    h3CI.classList.add('title');
    h3CI.innerText = course_info['course_code'];
    const h3subtitleCI = document.createElement('h3', { 'class': 'subtitle' });
    h3subtitleCI.innerText = course_info['course_name'];
    h3subtitleCI.classList.add('subtitle');
    const pCI = document.createElement('p');
    const bCI = document.createElement('b');
    bCI.innerText = 'Prerequisites: '
    const spanCI = document.createElement('span');
    spanCI.innerText = course_info['handbook_prereqs'] && course_info['handbook_prereqs'].length > 0 ? course_info['handbook_prereqs'] : 'None';
    const br1 = document.createElement('br');
    const handbookSummary = document.createElement('div');
    handbookSummary.innerText = course_info['handbook_summary'];
    const br2 = document.createElement('br');
    const ulCI = document.createElement('ul');
    ulCI.style.marginLeft = '30px';
    const liCI1 = document.createElement('li');
    liCI1.classList.add('external-link');
    const liCI2 = document.createElement('li');
    liCI2.classList.add('external-link');
    const aCI1 = document.createElement('a');
    aCI1.innerText = 'Course Website';
    aCI1.setAttribute('href', course_info['host_url']);
    const aCI2 = document.createElement('a');
    aCI2.innerText = 'UNSW Handbook';
    const handbook_lvl = course_info['grad_level'] === 'both' ? 'postgraduate' : handbook_lvl;
    aCI2.setAttribute('href', `https://www.handbook.unsw.edu.au/${handbook_lvl}/courses/2020/${course_info['course_code']}`);
    
    
    
    // LECTURE KEYWORDS
    const lectureKeywordDiv				= document.createElement('div');
    const lectureKeywordHeading			= document.createElement('h3');
    lectureKeywordHeading.classList.add('title');
    lectureKeywordHeading.innerText = "Lecture Keywords";
    const lectureKeywordListDiv			= document.createElement('div');
    
    // Get a list of all lecture keywords and display them, coloured by frequency
    getCourseLectureKeywords(course_info['course_id']).then(result => {
    	// Turn keywords into dictionary
    	let keywords = result.split(",");
    	let keywordDict = {};
    	for (let i = 0; i < keywords.length; i++) {
    		keywordDict[keywords[i]]++;
    	}
    	// Display keywords with colour based on frequency
    	for (const [keyword, num_occurences] of Object.entries(keywordDict)) {
    		const newKeyword = document.createElement('p');
    		newKeyword.innerText = keyword;
    		newKeyword.setAttribute("style", "color: green;");
    		lectureKeywordListDiv.appendChild(newKeyword);
    	}
    });
    
    lectureKeywordDiv.appendChild(lectureKeywordHeading);
    lectureKeywordDiv.appendChild(lectureKeywordListDiv);
    
    
    
    // ASSUMED KNOWLEDGE
    const assumedKnowledgeDiv 			= document.createElement('div');
    // Display textbox and button
    const assumedKnowledgeHeading 		= document.createElement('h3');
    assumedKnowledgeHeading.classList.add('title');
    const assumedKnowledgeTextboxAutoComplete = document.createElement('div');
    assumedKnowledgeTextboxAutoComplete.setAttribute("class", "autocomplete");
    const assumedKnowledgeTextbox 		= document.createElement('input');
    assumedKnowledgeTextbox.type = "text";
    assumedKnowledgeTextboxAutoComplete.appendChild(assumedKnowledgeTextbox);
    assumedKnowledgeTextboxAutoComplete.setAttribute("style", "position:relative");
    
    assumedKnowledgeHeading.innerText = "Assumed Knowledge";
    
    // Show current assumed knowledge
    const assumedKnowledgeKeywords = document.createElement('div');
    const assumedKnowledgeKeywordsHeading = document.createElement('p');
    assumedKnowledgeKeywordsHeading.innerText = "Current assumed knowledge:";
    assumedKnowledgeKeywords.appendChild(assumedKnowledgeKeywordsHeading);
    
    var AKKeywords = [];
    getAssumedKnowledgeKeywords(course_info['course_id']).then(result => {
    	// Old method: displays every keyword on a new line
    	AKKeywords = result.split(",");
    	// Alternative method: displays all keywords in a comma-spearated list
    	// var keywords = [result];
    	for (var i = 0; i < AKKeywords.length; i++) {
    		const newKeyword = document.createElement('p');
    		newKeyword.innerText = AKKeywords[i];
    		assumedKnowledgeKeywords.appendChild(newKeyword);
    	}
    });
    
    // Predictive dropdown text
    getAllLectureKeywords().then(result => {
    	var keywords = [...new Set(result.split(","))];
    	autocomplete(assumedKnowledgeTextbox, keywords);
    });
    
    // Create a list of assumed knowledge to insert
    const newAssumedKnowledgeWrapper = document.createElement('div');
    const newAssumedKnowledgeDiv = document.createElement('div');
    const newAssumedKnowledgeButton = document.createElement('button');
    newAssumedKnowledgeButton.innerText = "Add to List";
    newAssumedKnowledgeWrapper.appendChild(newAssumedKnowledgeButton);
    newAssumedKnowledgeWrapper.appendChild(newAssumedKnowledgeDiv);
    
    const assumedKnowledgeSubmitButton	= document.createElement('button');
    assumedKnowledgeSubmitButton.innerText = "Save Additions";
    
    const newKnowledgeHeader = document.createElement('div');
    newKnowledgeHeader.innerText = "Keywords to add:";
    
    const entryError = document.createElement('p');
    entryError.setAttribute("style", "color: red;");
    
    let numNewAssumedKnowledge = 0;
    let newAssumedKnowledgeKeywords = [];
    newAssumedKnowledgeButton.addEventListener('click', (e) => {
    	let newKnowledge = assumedKnowledgeTextbox.value.replace(/ .*/,'').toLowerCase();
    	let notDuplicate = true;
    	for (let i = 0; i < numNewAssumedKnowledge; i++) {
    		if (newAssumedKnowledgeKeywords[i] == newKnowledge) {
    			notDuplicate = false;
    			break;
    		}
    	}
    	if (notDuplicate && newKnowledge != "" && newKnowledge[newKnowledge.length-1] != ',') {
    		entryError.innerText = "";
    		if (numNewAssumedKnowledge == 0) {
    			newAssumedKnowledgeDiv.appendChild(newKnowledgeHeader);
    			newAssumedKnowledgeDiv.appendChild(assumedKnowledgeSubmitButton);
    		}
    		const tempDiv = document.createElement('div');
    		const tempNewKnowledge = document.createElement('span');
    		tempNewKnowledge.innerText = newKnowledge;
    		const tempNewKnowledgeX = document.createElement('button');
    		tempNewKnowledgeX.innerText = "X";
    		tempNewKnowledgeX.setAttribute("style", "height: 24px; width: 24px; margin-right: 12px;");
    		tempDiv.appendChild(tempNewKnowledgeX);
    		tempDiv.appendChild(tempNewKnowledge);
    		
    		newAssumedKnowledgeDiv.insertBefore(tempDiv, assumedKnowledgeSubmitButton);
    		newAssumedKnowledgeKeywords.push(newKnowledge);
    		numNewAssumedKnowledge++;
    		assumedKnowledgeTextbox.innerText = "";
    		
    		tempNewKnowledgeX.addEventListener('click', (e) => {
    			numNewAssumedKnowledge--;
    			newAssumedKnowledgeKeywords.splice(newAssumedKnowledgeKeywords.indexOf(newKnowledge), 1);
				tempDiv.remove();
			});
    	} else {
    		entryError.innerText = "'" + newKnowledge + "' is not a valid keyword. " +
    		                       "Please enter single keywords that aren't already present in the Assumed Knowledge list.";
    	}
    });
    
    // Insert assumed knowledge into database
    // TODO: Insertion confirmation & update textbox
    assumedKnowledgeSubmitButton.addEventListener('click', (e) => {
    	if (numNewAssumedKnowledge > 0) {
    		insertAssumedKnowledge(course_info['course_id'], newAssumedKnowledgeKeywords);
    		newAssumedKnowledgeKeywords = [];
    		numNewAssumedKnowledge = 0;
    		newAssumedKnowledgeDiv.innerHTML = "";
    		entryError.innerText = "";
    	}
    });
    
    // Database 'clear assumed knowledge' button
    const clearAssumedKnowledgeButton = document.createElement('button');
    clearAssumedKnowledgeButton.innerText = "Clear Assumed Knowledge";
    clearAssumedKnowledgeButton.addEventListener('click', (e) => {
        clearAssumedKnowledge(course_info['course_id']);
    });
    
    // Add to Assumed Knowledge div
    assumedKnowledgeDiv.setAttribute("style", "position:relative");
    assumedKnowledgeDiv.appendChild(assumedKnowledgeHeading);
    assumedKnowledgeDiv.appendChild(assumedKnowledgeKeywords);
    assumedKnowledgeDiv.appendChild(clearAssumedKnowledgeButton);
    assumedKnowledgeDiv.appendChild(entryError);
    assumedKnowledgeDiv.appendChild(assumedKnowledgeTextboxAutoComplete);
    assumedKnowledgeDiv.appendChild(newAssumedKnowledgeButton);
    assumedKnowledgeDiv.appendChild(newAssumedKnowledgeWrapper);

    liCI1.appendChild(aCI1);
    liCI2.appendChild(aCI2);
    ulCI.appendChild(liCI1);
    ulCI.appendChild(liCI2);
    pCI.appendChild(bCI);
    pCI.appendChild(spanCI);
    divCI.appendChild(h3CI);
    divCI.appendChild(h3subtitleCI);
    divCI.appendChild(pCI);
    divCI.appendChild(br1);
    divCI.appendChild(handbookSummary);
    divCI.appendChild(br2);
    divCI.appendChild(ulCI);
    
    divCI.appendChild(lectureKeywordDiv);
    divCI.appendChild(assumedKnowledgeDiv);
    
    addToSidebar(divCI, true, currGraph);
}

export function showSearchResults(search_term, search_results, currGraph) {
    clearSidebar();
    const div = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.classList.add('title');
    h3.innerText = 'Results';
    const p = document.createElement('p');
    const b = document.createElement('b');
    b.appendChild(document.createTextNode(search_term));

    const ul = document.createElement('ul');
    ul.style.marginLeft = '30px';
    search_results.forEach(course => {
        const li = document.createElement('li');
        li.classList.add('external-link');
        li.innerText = course;
        ul.appendChild(li);

    });
    p.appendChild(document.createTextNode('Courses that relate to '));
    p.appendChild(b);
    p.appendChild(document.createTextNode(' most:'));
    p.appendChild(ul);
    div.appendChild(h3);
    div.appendChild(p);

    addToSidebar(div, true, currGraph);

};

export function showCourseRelationship(course_a, course_b, relationship_info, subcategories_colours, edgeName, currGraph) {
    clearSidebar();
    const div = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.classList.add('title');
    h3.innerText = 'Similarity';
    const p = document.createElement('p');
    p.innerHTML = `<b>${course_a}</b> and <b>${course_b}</b> have these similarities:`;
    p.appendChild(document.createElement('br'));
    p.appendChild(document.createElement('br'));
    const subcats = Object.keys(relationship_info);
    subcats.forEach(subcat => {
        if (subcat === 'likes' || subcat === 'dislikes') {
            return; //not subcats
        }
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        const percentage = (parseFloat(relationship_info[subcat]['percentage']) * 100).toFixed(2);
        summary.classList.add(`${subcategories_colours.find(ele => ele[0] === subcat)[2]}`);
        summary.appendChild(document.createTextNode(subcat + ` (${percentage}%)`));
        const ul = document.createElement('ul');
        ul.classList.add('ordering');
        ul.style.marginLeft = '30px';
        const wp_cats = relationship_info[subcat]['wp_categories'];
        wp_cats.forEach(wp_cat => {
            const li = document.createElement('li');
            li.classList.add('external-link');
            li.innerText = wp_cat; // todo: WP link
            ul.appendChild(li);
        })

        details.appendChild(summary);
        details.appendChild(ul);
        p.appendChild(details);

    });

    const createButton = (icon, num) => {
        const likeButton = document.createElement('button');
        likeButton.classList.add('button', 'is-small');
        const likeSpan = document.createElement('span');
        likeSpan.classList.add('icon', 'is-small');
        const likeI = document.createElement('i');
        likeI.classList.add('fas', icon);
        const likeSpan2 = document.createElement('span');
        likeSpan2.id = icon === 'fa-thumbs-up' ? 'numUpvotes' : 'numDownvotes';
        likeSpan2.innerText = num; // num likes
        likeSpan.appendChild(likeI);
        likeButton.appendChild(likeSpan);
        likeButton.appendChild(likeSpan2);
        return likeButton;
    }

    const vote = (button, button2, colour, action, unAction, a, b, voteDir, unAction2, textID, textID2) => {

        if (button2.classList.contains('is-selected')) {
            // we swap from upvote to downvote (or down to up)
            // need to unvote
            const numVotes = document.getElementById(textID2);
            const old = parseInt(numVotes.innerText);
            numVotes.innerText = (old - 1).toString();
            unAction2(a, b);
        }
        button2.classList.remove('is-success', 'is-danger', 'is-selected');
        if (button.classList.contains(colour)) {
            // remove the vote

            unAction(a, b);
            const numVotes2 = document.getElementById(textID);
            const old2 = parseInt(numVotes2.innerText);
            numVotes2.innerText = (old2 - 1).toString();
            localStorage.setItem(edgeName, 0);
        } else {
            // add the vote
            action(a, b);
            const numVotes2 = document.getElementById(textID);
            const old2 = parseInt(numVotes2.innerText);
            numVotes2.innerText = (old2 + 1).toString();
            localStorage.setItem(edgeName, voteDir);
        }
        button.classList.toggle(colour);
        button.classList.toggle('is-selected');
    };

    const likeDislike = document.createElement('div');
    likeDislike.style.textAlign = 'center';
    const likeDislikeP = document.createElement('p');
    likeDislikeP.fontSize = 'small';
    likeDislikeP.innerText = 'Is this similarity useful?';
    const buttons = document.createElement('div');
    buttons.classList.add('buttons', 'has-addons', 'is-centered');

    const likeButton = createButton('fa-thumbs-up', relationship_info['likes']);
    const dislikeButton = createButton('fa-thumbs-down', relationship_info['dislikes']);

    // check to see if user has already voted
    const hasVoted = localStorage.getItem(edgeName);
    if (hasVoted === '1') {
        // pos vote
        likeButton.classList.add('is-success', 'is-selected');
    } else if (hasVoted === '-1') {
        // neg
        dislikeButton.classList.add('is-danger', 'is-selected');
    }

    likeButton.addEventListener('click', (e) => {
        vote(likeButton, dislikeButton, 'is-success', likeRelation, unlikeRelation, course_a, course_b, 1, undislikeRelation, 'numUpvotes', 'numDownvotes');
    });
    dislikeButton.addEventListener('click', (e) => {
        vote(dislikeButton, likeButton, 'is-danger', dislikeRelation, undislikeRelation, course_a, course_b, -1, unlikeRelation, 'numDownvotes', 'numUpvotes');
    });
    buttons.appendChild(likeButton);
    buttons.appendChild(dislikeButton);
    likeDislike.appendChild(likeDislikeP);
    likeDislike.appendChild(buttons);

    div.appendChild(h3);
    div.appendChild(p);
    div.appendChild(document.createElement('br'));
    div.appendChild(document.createElement('br'));
    div.appendChild(likeDislike);

    addToSidebar(div, true, currGraph);
}

export function hideShowSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.style.display === 'flex') {
        sidebar.style.zIndex = 0;
        sidebar.style.display = 'none';
    } else {
        sidebar.style.zIndex = 2;
        sidebar.style.display = 'flex';
    }
}

export function showFilteringOptions(currGraph) {
    const div = document.createElement('div');
    const filterTitle = document.createElement('h3');
    filterTitle.innerText = 'Filter';
    filterTitle.classList.add('title');
    const classes = ['Undergraduate', 'Postgraduate', 'Both'];
    // div.appendChild(filterTitle);
    const radioDiv = document.createElement('div');
    const ul = document.createElement('ul');
    radioDiv.appendChild(ul);
    classes.forEach(class_ => {
        const li = document.createElement('li');
        const input = document.createElement('input');
        input.type = 'radio';
        input.id = class_;
        input.name = 'classes';
        input.value = class_;
        const label = document.createElement('label');
        label.for = class_;
        label.innerText = ' ' + class_;
        li.appendChild(input);
        li.appendChild(label);
        ul.appendChild(li);
        input.addEventListener('click', () => {
            // unhide all
            // currGraph.nodes().style("display", "");
            const course_codes = currGraph.nodes().map(ele => {
                return ele._private.data.id;
            });
            logg(`Filtering by ${class_} in graph ${(currGraph._private.elements.length > 200) ? "prerequisites" : "similarity"}.`);
            getCoursesInfo(course_codes).then(grad_courses => {
                if (class_ === 'Undergraduate') {
                    currGraph.filter(ele => grad_courses['undergraduate'].includes(ele.data('id'))).style('display', '')
                    currGraph.filter(ele => grad_courses['postgraduate'].includes(ele.data('id'))).style('display', 'none')
                    currGraph.filter(ele => ele.data('or_node') && ele.isNode() && ele.incomers(":visible").length === 0).style('display', 'none')
                } else if (class_ === 'Postgraduate') {
                    currGraph.filter(ele => grad_courses['postgraduate'].includes(ele.data('id'))).style('display', '')
                    currGraph.filter(ele => grad_courses['undergraduate'].includes(ele.data('id'))).style('display', 'none')
                    currGraph.filter(ele => ele.data('or_node') && ele.isNode() && ele.incomers(":visible").length === 0).style('display', 'none')
                } else {
                    // unhide all
                    currGraph.nodes().style("display", "");
                    // const similarityCourses = ['COMP9020', 'COMP6752', 'COMP9242', 'COMP4601', 'COMP6741', 'COMP3141', 'COMP3821', 'COMP3211', 'COMP1511', 'COMP2111', 'COMP9517', 'COMP3231', 'COMP3161', 'COMP3222', 'COMP4418', 'COMP9334'];
                    // currGraph.filter(ele => {
                    //     console.log(ele.data('id'))
                    //     return similarityCourses.includes(ele.data('id'))
                    // }).style('display', '')
                    // currGraph.filter(ele => {
                    //     console.log(ele.data('id'))
                    //     return !similarityCourses.includes(ele.data('id'))
                    // }).style('display', 'none')
                }
            });
        })
    })
    // Select 'both' by default
    //ul.childNodes[ul.childNodes.length - 1].querySelector('input').checked = true;
    // Select 'undergraduate' by default
    ul.childNodes[0].querySelector('input').click();
    
    div.appendChild(radioDiv)
    const divRB = document.createElement('div');
    divRB.classList.add('buttons', 'is-centered');
    const resetButton = document.createElement('button');
    resetButton.classList.add('button', 'is-light');
    resetButton.innerText = 'Reset all filters';
    resetButton.addEventListener('click', () => {
        currGraph.nodes().style("display", "");
        currGraph.edges().style('display', "");
        document.querySelector('#threshold-slider').value = 25;
        currGraph.edges().filter((e) => {
            return e.width() * 10 <= 25;
        }).style('display', 'none');
        document.querySelector('#slider-output').value = 25;
        ul.childNodes[ul.childNodes.length - 1].querySelector('input').checked = true;
    })
    divRB.appendChild(resetButton);
    div.appendChild(document.createElement('br'))
    if (getCurrGraphName(currGraph) === 'similarity') {
        div.appendChild(divRB)
    }

    addToSidebar(div, false, null);
}

function addToSidebar(node, go_back = true, currGraph) {
    const sidebar = document.getElementById('sidebar');
    if (go_back) {
        const goBackNode = document.createElement('a');
        goBackNode.classList.add('delete');
        goBackNode.style.marginTop = '10px';
        goBackNode.style.marginLeft = '10px';
        goBackNode.addEventListener('click', () => {
            showLegend(currGraphLegend, currGraph);
        })
        node.querySelector('h3').appendChild(goBackNode);
        // sidebar.appendChild(goBackNode);
    }
    sidebar.appendChild(node);
    if (sidebar.style.display !== 'flex') {
        hideShowSidebar();
    }
}

function clearSidebar() {
    const el = document.getElementById('sidebar');
    el.innerHTML = '';
}

// Autocomplete textbox
// Source:
// https://www.w3schools.com/howto/howto_js_autocomplete.asp
function autocomplete(inp, arr) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function(e) {
      var a, b, i, val = this.value;
      /*close any already open lists of autocompleted values*/
      closeAllLists();
      if (!val) { return false;}
      currentFocus = -1;
      /*create a DIV element that will contain the items (values):*/
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      /*append the DIV element as a child of the autocomplete container:*/
      this.parentNode.appendChild(a);
      /*for each item in the array...*/
      for (i = 0; i < arr.length; i++) {
        /*check if the item starts with the same letters as the text field value:*/
        if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
          /*create a DIV element for each matching element:*/
          b = document.createElement("DIV");
          /*make the matching letters bold:*/
          b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
          b.innerHTML += arr[i].substr(val.length);
          /*insert a input field that will hold the current array item's value:*/
          b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
          /*execute a function when someone clicks on the item value (DIV element):*/
              b.addEventListener("click", function(e) {
              /*insert the value for the autocomplete text field:*/
              inp.value = this.getElementsByTagName("input")[0].value;
              /*close the list of autocompleted values,
              (or any other open lists of autocompleted values:*/
              closeAllLists();
          });
          a.appendChild(b);
        }
      }
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function(e) {
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {
        /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
        currentFocus++;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 38) { //up
        /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
        currentFocus--;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 13) {
        /*If the ENTER key is pressed, prevent the form from being submitted,*/
        e.preventDefault();
        if (currentFocus > -1) {
          /*and simulate a click on the "active" item:*/
          if (x) x[currentFocus].click();
        }
      }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
      x[i].parentNode.removeChild(x[i]);
    }
  }
}
/*execute a function when someone clicks in the document:*/
document.addEventListener("click", function (e) {
    closeAllLists(e.target);
});
}



