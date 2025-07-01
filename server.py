#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
51Trip 旅行规划应用 - 本地服务器
简单的HTTP服务器，用于运行HTML旅行规划应用
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from urllib.parse import unquote

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """自定义HTTP请求处理器，支持中文文件名"""
    
    def do_GET(self):
        # 解码URL中的中文字符
        self.path = unquote(self.path, 'utf-8')
        return super().do_GET()
    
    def guess_type(self, path):
        # 确保CSS文件使用正确的MIME类型
        mimetype, encoding = super().guess_type(path)
        if str(path).endswith('.css'):
            return 'text/css'
        return mimetype
    
    def end_headers(self):
        # 添加UTF-8编码头
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        super().end_headers()

def main():
    """启动HTTP服务器"""
    PORT = 8000
    
    # 检查端口是否可用
    while True:
        try:
            with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
                print("=" * 60)
                print("🎉 51Trip 旅行规划应用服务器已启动")
                print("=" * 60)
                print(f"📍 本地地址: http://localhost:{PORT}")
                print(f"📍 局域网地址: http://127.0.0.1:{PORT}")
                print("=" * 60)
                print("📋 可用页面:")
                print(f"   • 项目导航: http://localhost:{PORT}/")
                print(f"   • 首页: http://localhost:{PORT}/首页.html")
                print(f"   • 目的地: http://localhost:{PORT}/目的地.html")
                print(f"   • AI旅行规划: http://localhost:{PORT}/AI旅行规划.html")
                print(f"   • 旅行助手: http://localhost:{PORT}/旅行助手.html")
                print(f"   • 个人中心: http://localhost:{PORT}/个人中心.html")
                print("=" * 60)
                print("💡 提示:")
                print("   • 按 Ctrl+C 停止服务器")
                print("   • 浏览器会自动打开项目主页")
                print("   • 支持移动端预览")
                print("=" * 60)
                
                # 自动在浏览器中打开
                try:
                    webbrowser.open(f'http://localhost:{PORT}')
                    print("🌐 浏览器已自动打开项目页面")
                except:
                    print("⚠️  无法自动打开浏览器，请手动访问上述地址")
                
                print("=" * 60)
                print("🚀 服务器正在运行中...")
                print("=" * 60)
                
                # 启动服务器
                httpd.serve_forever()
                
        except OSError as e:
            if e.errno == 98:  # Address already in use
                PORT += 1
                print(f"端口 {PORT-1} 已被占用，尝试端口 {PORT}")
                continue
            else:
                print(f"❌ 启动服务器时发生错误: {e}")
                sys.exit(1)
        except KeyboardInterrupt:
            print("\n" + "=" * 60)
            print("👋 服务器已停止，感谢使用 51Trip!")
            print("=" * 60)
            sys.exit(0)

if __name__ == "__main__":
    # 确保在正确的目录中运行
    if not os.path.exists("index.html"):
        print("❌ 错误: 找不到 index.html 文件")
        print("请确保在项目根目录中运行此脚本")
        sys.exit(1)
    
    main()