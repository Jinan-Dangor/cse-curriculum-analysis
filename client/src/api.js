// const url = 'http://127.0.0.1:5000';
// const url = 'http://localhost/api';
const url = 'http://hri.cse.unsw.edu.au/api';

export function getGraphData() {
    return fetch(url + '/graph').then(
        resp => {
            return resp.json();
        }
    )
}

export function getPrereqs() {
    return fetch(url + '/prereqs').then(
        resp => {
            return resp.json();
        }
    )
}

export function getCourseInfo(course_code) {
    return fetch(url + '/course/' + course_code).then(
        resp => {
            return resp.json();
        }
    )
}

export function getCoursesInfo(course_codes) {
    return fetch(url + '/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            courses: course_codes
        })
    }).then(
        resp => {
            return resp.json();
        }
    )
}

export function search(search_term) {
    return fetch(url + '/search?phrase=' + search_term.toLowerCase()).then(
        resp => {
            return resp.json();
        }
    )
}

export function getRelation(course_a, course_b) {
    return fetch(url + `/relationship/${course_a}/${course_b}`).then(
        resp => {
            return resp.json();
        }
    )
}

function createRelationVoteRequest(a, b, action) {
    return {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            course_a: a,
            course_b: b,
            action: action
        })
    }
}

export function likeRelation(a, b) {
    return fetch(url + '/vote', createRelationVoteRequest(a, b, 'like'));
}

export function unlikeRelation(a, b) {
    return fetch(url + '/vote', createRelationVoteRequest(a, b, 'unlike'));
}
export function dislikeRelation(a, b) {
    return fetch(url + '/vote', createRelationVoteRequest(a, b, 'dislike'));
}
export function undislikeRelation(a, b) {
    return fetch(url + '/vote', createRelationVoteRequest(a, b, 'undislike'));
}

export function logg(msg) {
    return fetch(url + '/log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            msg: msg
        })
    })
}
