import { currGraphLegend } from './index.js';
import { unlikeRelation, undislikeRelation, likeRelation, dislikeRelation, getCoursesInfo, logg } from './api.js';

export function showLegend(items, currGraph) {
    clearSidebar();

    const divLegend = document.createElement('div');
    const h3Legend = document.createElement('h3');
    h3Legend.classList.add('title');
    h3Legend.appendChild(document.createTextNode('Legend'));
    const ulLegend = document.createElement('ul');
    ulLegend.classList.add('ordering');

    items.forEach(item => {
        const li = document.createElement('li');
        const colour_block = document.createElement('span');
        colour_block.style['background'] = item[1];
        li.appendChild(colour_block);
        li.appendChild(document.createTextNode(item[0]));
        ulLegend.appendChild(li);
    });

    divLegend.appendChild(h3Legend);
    divLegend.appendChild(ulLegend);
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
    aCI2.setAttribute('href', `https://www.handbook.unsw.edu.au/${course_info['grad_level']}/courses/2020/${course_info['course_code']}`);

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
    div.appendChild(filterTitle);
    const radioDiv = document.createElement('div');
    classes.forEach(class_ => {
        const input = document.createElement('input');
        input.type = 'radio';
        input.id = class_;
        input.name = 'classes';
        input.value = class_;
        const label = document.createElement('label');
        label.for = class_;
        label.innerText = class_;
        radioDiv.appendChild(input);
        radioDiv.appendChild(label);
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
                    currGraph.filter(ele => ele.data('or_node') && ele.isNode() && ele.degree() < 1).style('display', 'none')
                } else if (class_ === 'Postgraduate') {
                    currGraph.filter(ele => grad_courses['postgraduate'].includes(ele.data('id'))).style('display', '')
                    currGraph.filter(ele => grad_courses['undergraduate'].includes(ele.data('id'))).style('display', 'none')
                    currGraph.filter(ele => ele.data('or_node') && ele.isNode() && ele.degree() < 1).style('display', 'none')
                } else {
                    // unhide all
                    currGraph.nodes().style("display", "");
                }
            });
        })
    })
    radioDiv.childNodes[radioDiv.childNodes.length - 2].checked = true;
    div.appendChild(radioDiv)

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