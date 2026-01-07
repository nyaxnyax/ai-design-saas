import requests
from PIL import Image, ImageDraw, ImageFont
import io
import os
import time

def create_comparison_image(before_url, after_url, output_path, logo_text="pikadesign.me"):
    """
    下载两张图片并合成一张带有 'Before & After' 标识的对比图
    """
    try:
        # 1. 下载图片
        before_resp = requests.get(before_url)
        after_resp = requests.get(after_url)
        
        before_img = Image.open(io.BytesIO(before_resp.content)).convert("RGB")
        after_img = Image.open(io.BytesIO(after_resp.content)).convert("RGB")
        
        # 2. 统一尺寸 (以 After 图为基准)
        target_size = after_img.size
        before_img = before_img.resize(target_size, Image.Resampling.LANCZOS)
        
        # 3. 创建画布 (宽度 * 2)
        canvas_width = target_size[0] * 2
        canvas_height = target_size[1]
        canvas = Image.new("RGB", (canvas_width, canvas_height), (255, 255, 255))
        
        # 4. 粘贴图片
        canvas.paste(before_img, (0, 0))
        canvas.paste(after_img, (target_size[0], 0))
        
        # 5. 绘制装饰元素
        draw = ImageDraw.Draw(canvas)
        
        # 绘制中间分割线 (细发丝白线)
        line_width = 4
        draw.line([(target_size[0], 0), (target_size[0], canvas_height)], fill=(255, 255, 255), width=line_width)
        
        # 载入字体 (尝试默认字体或常用系统字体)
        try:
            # Windows 常用字体路径
            font_path = "C:\\Windows\\Fonts\\arialbd.ttf"
            font_large = ImageFont.truetype(font_path, int(canvas_height * 0.05))
            font_small = ImageFont.truetype(font_path, int(canvas_height * 0.03))
        except:
            font_large = ImageFont.load_default()
            font_small = ImageFont.load_default()

        # 绘制 'BEFORE' 和 'AFTER' 标签
        def draw_label(text, pos, bg_color):
            text_bbox = draw.textbbox((0, 0), text, font=font_large)
            text_w = text_bbox[2] - text_bbox[0]
            text_h = text_bbox[3] - text_bbox[1]
            padding = 20
            
            # 标签背景
            rect_pos = [pos[0], pos[1], pos[0] + text_w + padding*2, pos[1] + text_h + padding*2]
            draw.rectangle(rect_pos, fill=bg_color)
            draw.text((pos[0] + padding, pos[1] + padding), text, font=font_large, fill=(255, 255, 255))

        draw_label("ORIGINAL", (30, 30), (50, 50, 50))
        draw_label("AI GENERATED", (target_size[0] + 30, 30), (147, 51, 234)) # 紫色调

        # 绘制 Logo 水印
        logo_bbox = draw.textbbox((0, 0), logo_text, font=font_small)
        logo_w = logo_bbox[2] - logo_bbox[0]
        logo_h = logo_bbox[3] - logo_bbox[1]
        draw.text((canvas_width - logo_w - 30, canvas_height - logo_h - 30), logo_text, font=font_small, fill=(200, 200, 200))

        # 6. 保存
        canvas.save(output_path, "JPEG", quality=95)
        print(f"Success: Saved to {output_path}")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    # 测试用例 (您可以替换为实际的 URL)
    test_before = "https://oxreulscshosunonitid.supabase.co/storage/v1/object/public/user-uploads/ae129202-698d-4e2b-bb66-8798e16be48a/4ce0dfcf-f84f-4024-916c-0e863333eee4.png"
    test_after = "https://oxreulscshosunonitid.supabase.co/storage/v1/object/public/generated-images/ae129202-698d-4e2b-bb66-8798e16be48a/d5958899-7813-4ed5-8a29-01f705e492ae.png"
    
    os.makedirs("marketing_assets", exist_ok=True)
    out_file = f"marketing_assets/post_{int(time.time())}.jpg"
    
    create_comparison_image(test_before, test_after, out_file)
