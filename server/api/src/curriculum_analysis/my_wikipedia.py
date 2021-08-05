import requests
import wikipedia
import collections

__WP_API_URL = "https://en.wikipedia.org/w/api.php"


def get_categories(page_title):
    r = requests.get(
        __WP_API_URL,
        params={
            "action": "query",
            "format": "json",
            "titles": page_title,
            "prop": "categories",
            "clshow": "!hidden",  # we don't care for WP meta-categories
        },
    )
    if not r.ok:
        return []
    req_json = r.json()
    return [
        cat["title"][9:]  # remove Category: prefix
        for cat in list(req_json["query"]["pages"].values())[0]["categories"]
    ]


def get_subcats(category_title):
    r = requests.get(
        __WP_API_URL,
        params={
            "action": "query",
            "list": "categorymembers",
            "cmtitle": category_title,
            "cmtype": "subcat",
            "limit": 500,
            "format": "json",
        },
    )
    req_json = r.json()
    return [cat["title"] for cat in req_json["query"]["categorymembers"]]


def get_map_cat_subcat(main_category, max_depth=6):
    # generate a map of categories to subcategories of computer science
    # a page could be related to multiple subcats, so the map is:
    # { category: set(subcategory1, subcat2...)}
    # BFS
    result = collections.defaultdict(set)
    queue = [(i, 0, i) for i in get_subcats(main_category)]
    seen = set()
    # https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Subfields%20of%20computer%20science&cmtype=subcat&cmlimit=500
    while queue:
        cat, depth, root_subcat = queue.pop(0)
        if cat != root_subcat:
            result[root_subcat].add(cat)
        seen.add(cat)
        if depth == max_depth:
            continue
        for subcat in get_subcats(cat):
            if subcat in seen:
                continue
            queue.append((subcat, depth + 1, root_subcat))
    return result


def wp_search(*words, results=5):
    return wikipedia.search(" ".join(words), results=results)

