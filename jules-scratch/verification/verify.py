from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        file_path = os.path.abspath('index.html')
        page.goto(f'file://{file_path}')
        page.screenshot(path='jules-scratch/verification/verification.png')
        browser.close()

if __name__ == '__main__':
    run()