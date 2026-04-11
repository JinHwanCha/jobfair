"""
Generate OG image (1200x630) matching the job fair poster design.
Yellow geometric shapes + black text on white background.
"""
from PIL import Image, ImageDraw, ImageFont
import math
import os

WIDTH, HEIGHT = 1200, 630
BG_COLOR = (253, 255, 245)
LIME_YELLOW = (200, 230, 64)       # primary-400
LIGHT_LIME = (238, 250, 160)       # primary-200
PALE_LIME = (247, 253, 208)        # primary-100
WARM_YELLOW = (255, 248, 197)      # warm-200
BLACK = (0, 0, 0)
DARK_GRAY = (51, 51, 51)
LIGHT_GRAY = (235, 235, 235)

img = Image.new('RGB', (WIDTH, HEIGHT), BG_COLOR)
draw = ImageDraw.Draw(img)

def draw_star(draw, cx, cy, outer_r, inner_r, points, color):
    """Draw a star/flower shape like the poster."""
    coords = []
    for i in range(points * 2):
        angle = math.pi * i / points - math.pi / 2
        r = outer_r if i % 2 == 0 else inner_r
        x = cx + r * math.cos(angle)
        y = cy + r * math.sin(angle)
        coords.append((x, y))
    draw.polygon(coords, fill=color)

def draw_diamond_star(draw, cx, cy, size, color):
    """Draw a diamond-burst geometric shape like the poster."""
    # Multiple thin triangles radiating from center
    num_points = 8
    for i in range(num_points):
        angle = 2 * math.pi * i / num_points
        next_angle = 2 * math.pi * (i + 0.5) / num_points
        prev_angle = 2 * math.pi * (i - 0.5) / num_points
        
        tip_x = cx + size * math.cos(angle)
        tip_y = cy + size * math.sin(angle)
        
        side1_x = cx + size * 0.08 * math.cos(next_angle)
        side1_y = cy + size * 0.08 * math.sin(next_angle)
        
        side2_x = cx + size * 0.08 * math.cos(prev_angle)
        side2_y = cy + size * 0.08 * math.sin(prev_angle)
        
        draw.polygon([(tip_x, tip_y), (side1_x, side1_y), (side2_x, side2_y)], fill=color)

# Draw geometric shapes like the poster
# Large lime-yellow star (left)
draw_diamond_star(draw, 180, 340, 250, LIME_YELLOW)

# Medium light lime star (center-right)
draw_diamond_star(draw, 680, 380, 180, LIGHT_LIME)

# Small pale geometric shapes (right area)
draw_diamond_star(draw, 1050, 150, 140, WARM_YELLOW)

# Light accent (top-right)
draw_diamond_star(draw, 1100, 80, 100, PALE_LIME)

# Try to use a nice font, fallback to default
font_paths = [
    "C:/Windows/Fonts/malgunbd.ttf",  # 맑은 고딕 Bold
    "C:/Windows/Fonts/malgun.ttf",     # 맑은 고딕
    "C:/Windows/Fonts/NanumGothicBold.ttf",
    "C:/Windows/Fonts/NanumGothic.ttf",
    "C:/Windows/Fonts/gulim.ttc",
]

def load_font(size, bold=False):
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except:
                continue
    return ImageFont.load_default()

# Fonts
font_small = load_font(26)
font_title = load_font(62, bold=True)
font_subtitle = load_font(30)
font_info = load_font(28)

# Text layout - positioned to avoid overlapping with geometric shapes
text_x = 380
text_y_start = 100

# "내수 직업박람회 신청 안내"
draw.text((text_x, text_y_start), "내수 직업박람회 신청 안내", fill=BLACK, font=font_small)

# "What am I Called for?" - main title
draw.text((text_x, text_y_start + 60), "What am I", fill=BLACK, font=font_title)
draw.text((text_x, text_y_start + 135), "Called for?", fill=BLACK, font=font_title)

# Date and location
draw.text((text_x, text_y_start + 260), "일시 : 5월 9일 토요일 오후 2시반 - 5시반", fill=BLACK, font=font_info)
draw.text((text_x, text_y_start + 305), "장소 : 내수동교회 본당", fill=BLACK, font=font_info)

# "2026 직업박람회" label at bottom
draw.text((text_x, text_y_start + 380), "2026 직업박람회 | 내수동교회", fill=DARK_GRAY, font=font_subtitle)

# Save
output_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'og-image.jpg')
img.save(output_path, 'JPEG', quality=92)
print(f"OG image saved to: {os.path.abspath(output_path)}")
print(f"Size: {WIDTH}x{HEIGHT}")
