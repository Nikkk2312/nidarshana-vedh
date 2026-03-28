from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = "C:/Users/niket/Downloads/nidarshana-vedh/screenshots"
URL = "http://localhost:1313/"
VIEWPORT_W = 1440
VIEWPORT_H = 900

screenshots = [
    {"y": 1400, "filename": "verify_niches.png", "label": "Niche Cards"},
    {"y": 2800, "filename": "verify_philosophy.png", "label": "Philosophy"},
    {"y": 4200, "filename": "verify_blog.png", "label": "Blog Cards"},
    {"y": 5600, "filename": "verify_testimonials.png", "label": "Testimonials + CTA"},
]

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": VIEWPORT_W, "height": VIEWPORT_H})
    page.goto(URL, wait_until="networkidle")

    # Get total page height for reference
    total_height = page.evaluate("document.body.scrollHeight")
    print(f"Page total scroll height: {total_height}px")

    for shot in screenshots:
        page.evaluate(f"window.scrollTo(0, {shot['y']})")
        page.wait_for_timeout(500)
        output_path = f"{SCREENSHOTS_DIR}/{shot['filename']}"
        page.screenshot(path=output_path, full_page=False)
        print(f"Captured {shot['label']} at y={shot['y']} -> {shot['filename']}")

    browser.close()
    print("All screenshots captured successfully.")
