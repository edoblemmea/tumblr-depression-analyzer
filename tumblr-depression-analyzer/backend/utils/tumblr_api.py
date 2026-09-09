import os
import requests
from requests_oauthlib import OAuth1
from dotenv import load_dotenv
load_dotenv()

API_KEY = os.environ.get('TUMBLR_API_KEY')
API_SECRET = os.environ.get('TUMBLR_API_SECRET')
TOKEN = os.environ.get('TUMBLR_TOKEN')
TOKEN_SECRET = os.environ.get('TUMBLR_TOKEN_SECRET')

def get_tagged_posts(tag, limit, before=None):
    url = f"https://api.tumblr.com/v2/tagged?tag={tag}&limit={limit}&api_key={API_KEY}"
    if before:
        url += f"&before={before}"
    response = requests.get(url)
    print("API_KEY cargada:", API_KEY, flush=True)
    return response.json()

'''
def get_blog_posts(blog):
    url = f"https://api.tumblr.com/v2/blog/{blog}/posts?api_key={API_KEY}"
    response = requests.get(url)
    return response.json()
'''

'''
def get_community_posts(handle):
    url = f"https://api.tumblr.com/v2/communities/{handle}/timeline?type=recent"
    auth = OAuth1(API_KEY, API_SECRET, TOKEN, TOKEN_SECRET)
    response = requests.get(url, auth=auth)
    return response.json()
'''