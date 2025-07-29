#!/usr/bin/env node

/**
 * 旅行助手应用构建优化脚本
 * 自动化性能优化流程，包括压缩、minification、缓存等
 */

const fs = require('fs').promises;
const path = require('path');
const { createHash } = require('crypto');

class BuildOptimizer {
  constructor() {
    this.config = {
      inputDir: '.',
      outputDir: 'dist',
      htmlFiles: ['首页.html', '目的地.html', 'AI旅行规划.html', '旅行助手.html', '个人中心.html'],
      staticFiles: ['optimized-common.css', 'performance-utils.js', 'sw.js', 'manifest.json'],
      imageExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
      compressionLevel: 9
    };
    
    this.stats = {
      originalSize: 0,
      optimizedSize: 0,
      compressionRatio: 0,
      filesProcessed: 0
    };
  }

  async init() {
    console.log('🚀 开始构建优化流程...\n');
    
    try {
      await this.createOutputDir();
      await this.processHTMLFiles();
      await this.processStaticFiles();
      await this.generateResourceMap();
      await this.createOptimizedServiceWorker();
      await this.generatePerformanceReport();
      
      console.log('\n✅ 构建优化完成！');
      this.printStats();
    } catch (error) {
      console.error('❌ 构建优化失败:', error.message);
      process.exit(1);
    }
  }

  async createOutputDir() {
    try {
      await fs.mkdir(this.config.outputDir, { recursive: true });
      console.log(`📁 创建输出目录: ${this.config.outputDir}`);
    } catch (error) {
      throw new Error(`无法创建输出目录: ${error.message}`);
    }
  }

  async processHTMLFiles() {
    console.log('\n📄 处理HTML文件...');
    
    for (const filename of this.config.htmlFiles) {
      try {
        const inputPath = path.join(this.config.inputDir, filename);
        const outputPath = path.join(this.config.outputDir, filename);
        
        if (await this.fileExists(inputPath)) {
          const content = await fs.readFile(inputPath, 'utf-8');
          const optimizedContent = await this.optimizeHTML(content);
          
          await fs.writeFile(outputPath, optimizedContent, 'utf-8');
          
          const originalSize = Buffer.byteLength(content, 'utf-8');
          const optimizedSize = Buffer.byteLength(optimizedContent, 'utf-8');
          const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
          
          this.updateStats(originalSize, optimizedSize);
          console.log(`  ✓ ${filename} - 减少 ${reduction}% (${this.formatBytes(originalSize)} → ${this.formatBytes(optimizedSize)})`);
        }
      } catch (error) {
        console.error(`  ❌ 处理 ${filename} 失败:`, error.message);
      }
    }
  }

  async optimizeHTML(content) {
    // 1. 移除多余空白字符
    let optimized = content
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s+>/g, '>')
      .replace(/<\s+/g, '<');

    // 2. 移除HTML注释（保留条件注释）
    optimized = optimized.replace(/<!--(?!\[if).*?-->/g, '');

    // 3. 优化图片标签
    optimized = this.optimizeImageTags(optimized);

    // 4. 添加资源完整性检查
    optimized = this.addResourceIntegrity(optimized);

    // 5. 优化内联CSS
    optimized = this.optimizeInlineCSS(optimized);

    return optimized;
  }

  optimizeImageTags(content) {
    // 确保所有图片都有width和height属性，添加loading="lazy"
    return content.replace(/<img([^>]*?)>/g, (match, attributes) => {
      let attrs = attributes;
      
      // 添加loading属性（如果不存在且不是关键图片）
      if (!attrs.includes('loading=') && !attrs.includes('critical-image')) {
        attrs += ' loading="lazy"';
      }
      
      // 添加decoding="async"
      if (!attrs.includes('decoding=')) {
        attrs += ' decoding="async"';
      }
      
      return `<img${attrs}>`;
    });
  }

  addResourceIntegrity(content) {
    // 为关键外部资源添加integrity检查
    const integrityMap = {
      'https://cdn.tailwindcss.com': 'sha384-example',
      'https://unpkg.com/@fortawesome/fontawesome-free': 'sha384-example'
    };

    let optimized = content;
    for (const [url, integrity] of Object.entries(integrityMap)) {
      optimized = optimized.replace(
        new RegExp(`(src=["']${url}[^"']*["'][^>]*?)>`, 'g'),
        `$1 crossorigin="anonymous">` // integrity="${integrity}"可以在生产环境中启用
      );
    }

    return optimized;
  }

  optimizeInlineCSS(content) {
    // 压缩内联CSS
    return content.replace(/<style[^>]*>(.*?)<\/style>/gs, (match, css) => {
      const minifiedCSS = css
        .replace(/\/\*.*?\*\//g, '')  // 移除注释
        .replace(/\s+/g, ' ')         // 压缩空白
        .replace(/;\s*}/g, '}')       // 移除最后的分号
        .replace(/\s*{\s*/g, '{')     // 清理花括号周围空白
        .replace(/\s*}\s*/g, '}')
        .replace(/:\s+/g, ':')        // 清理冒号后空白
        .replace(/;\s+/g, ';')        // 清理分号后空白
        .trim();

      return `<style>${minifiedCSS}</style>`;
    });
  }

  async processStaticFiles() {
    console.log('\n📦 处理静态文件...');
    
    for (const filename of this.config.staticFiles) {
      try {
        const inputPath = path.join(this.config.inputDir, filename);
        const outputPath = path.join(this.config.outputDir, filename);
        
        if (await this.fileExists(inputPath)) {
          const content = await fs.readFile(inputPath, 'utf-8');
          let optimizedContent = content;
          
          if (filename.endsWith('.css')) {
            optimizedContent = this.optimizeCSS(content);
          } else if (filename.endsWith('.js')) {
            optimizedContent = this.optimizeJS(content);
          }
          
          await fs.writeFile(outputPath, optimizedContent, 'utf-8');
          
          const originalSize = Buffer.byteLength(content, 'utf-8');
          const optimizedSize = Buffer.byteLength(optimizedContent, 'utf-8');
          const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
          
          this.updateStats(originalSize, optimizedSize);
          console.log(`  ✓ ${filename} - 减少 ${reduction}% (${this.formatBytes(originalSize)} → ${this.formatBytes(optimizedSize)})`);
        }
      } catch (error) {
        console.error(`  ❌ 处理 ${filename} 失败:`, error.message);
      }
    }
  }

  optimizeCSS(content) {
    return content
      .replace(/\/\*.*?\*\//gs, '')     // 移除注释
      .replace(/\s+/g, ' ')             // 压缩空白
      .replace(/;\s*}/g, '}')           // 移除最后的分号
      .replace(/\s*{\s*/g, '{')         // 清理花括号
      .replace(/\s*}\s*/g, '}')
      .replace(/:\s+/g, ':')            // 清理冒号
      .replace(/;\s+/g, ';')            // 清理分号
      .replace(/,\s+/g, ',')            // 清理逗号
      .trim();
  }

  optimizeJS(content) {
    // 基础JS优化（生产环境建议使用专业工具如Terser）
    return content
      .replace(/\/\*[\s\S]*?\*\//g, '')    // 移除块注释
      .replace(/\/\/.*$/gm, '')            // 移除行注释
      .replace(/\s+/g, ' ')                // 压缩空白
      .replace(/;\s*}/g, '}')              // 清理分号
      .replace(/\s*{\s*/g, '{')            // 清理花括号
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*,\s*/g, ',')            // 清理逗号
      .replace(/\s*;\s*/g, ';')            // 清理分号
      .trim();
  }

  async generateResourceMap() {
    console.log('\n🗺️  生成资源映射...');
    
    const resourceMap = {
      version: Date.now(),
      files: {},
      critical: ['optimized-common.css', 'performance-utils.js'],
      preload: ['首页.html', '目的地.html']
    };

    const files = await fs.readdir(this.config.outputDir);
    
    for (const file of files) {
      const filePath = path.join(this.config.outputDir, file);
      const content = await fs.readFile(filePath);
      const hash = createHash('sha256').update(content).digest('hex').substring(0, 8);
      
      resourceMap.files[file] = {
        hash,
        size: content.length,
        type: this.getFileType(file)
      };
    }

    const mapPath = path.join(this.config.outputDir, 'resource-map.json');
    await fs.writeFile(mapPath, JSON.stringify(resourceMap, null, 2));
    
    console.log(`  ✓ 资源映射已生成: resource-map.json`);
  }

  async createOptimizedServiceWorker() {
    console.log('\n⚙️  优化Service Worker...');
    
    const swPath = path.join(this.config.outputDir, 'sw.js');
    const resourceMapPath = path.join(this.config.outputDir, 'resource-map.json');
    
    if (await this.fileExists(resourceMapPath)) {
      const resourceMap = JSON.parse(await fs.readFile(resourceMapPath, 'utf-8'));
      const swContent = await fs.readFile(swPath, 'utf-8');
      
      // 更新缓存版本和文件列表
      const optimizedSW = swContent
        .replace(/const CACHE_VERSION = '[^']+';/, `const CACHE_VERSION = 'travel-app-v${resourceMap.version}';`)
        .replace(/const STATIC_ASSETS = \[[\s\S]*?\];/, this.generateStaticAssetsList(resourceMap));

      await fs.writeFile(swPath, optimizedSW);
      console.log(`  ✓ Service Worker已优化`);
    }
  }

  generateStaticAssetsList(resourceMap) {
    const assets = Object.keys(resourceMap.files)
      .filter(file => file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.js'))
      .map(file => `  '/${file}'`)
      .join(',\n');

    return `const STATIC_ASSETS = [\n${assets}\n];`;
  }

  async generatePerformanceReport() {
    console.log('\n📊 生成性能报告...');
    
    const report = {
      buildTime: new Date().toISOString(),
      optimization: {
        totalFiles: this.stats.filesProcessed,
        originalSize: this.stats.originalSize,
        optimizedSize: this.stats.optimizedSize,
        compressionRatio: this.stats.compressionRatio,
        savedBytes: this.stats.originalSize - this.stats.optimizedSize
      },
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(this.config.outputDir, 'build-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`  ✓ 性能报告已生成: build-report.json`);
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.stats.compressionRatio < 30) {
      recommendations.push('考虑启用gzip或brotli压缩以进一步减少文件大小');
    }
    
    recommendations.push('部署到CDN以提高全球访问速度');
    recommendations.push('配置HTTP缓存头以优化重复访问性能');
    recommendations.push('定期运行Lighthouse审计监控性能指标');
    
    return recommendations;
  }

  // 工具方法
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  updateStats(originalSize, optimizedSize) {
    this.stats.originalSize += originalSize;
    this.stats.optimizedSize += optimizedSize;
    this.stats.filesProcessed++;
    
    if (this.stats.originalSize > 0) {
      this.stats.compressionRatio = ((this.stats.originalSize - this.stats.optimizedSize) / this.stats.originalSize * 100);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const typeMap = {
      '.html': 'document',
      '.css': 'stylesheet',
      '.js': 'script',
      '.json': 'data',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.png': 'image',
      '.gif': 'image',
      '.webp': 'image',
      '.svg': 'image'
    };
    return typeMap[ext] || 'unknown';
  }

  printStats() {
    console.log('\n📈 优化统计:');
    console.log(`  处理文件: ${this.stats.filesProcessed}`);
    console.log(`  原始大小: ${this.formatBytes(this.stats.originalSize)}`);
    console.log(`  优化后大小: ${this.formatBytes(this.stats.optimizedSize)}`);
    console.log(`  压缩率: ${this.stats.compressionRatio.toFixed(1)}%`);
    console.log(`  节省空间: ${this.formatBytes(this.stats.originalSize - this.stats.optimizedSize)}`);
    
    console.log('\n🎯 下一步建议:');
    console.log('  1. 部署到支持HTTP/2的服务器');
    console.log('  2. 配置CDN加速全球访问');
    console.log('  3. 启用服务器端压缩（gzip/brotli）');
    console.log('  4. 配置适当的缓存策略');
    console.log('  5. 监控Core Web Vitals指标');
  }
}

// 运行优化器
if (require.main === module) {
  const optimizer = new BuildOptimizer();
  optimizer.init().catch(console.error);
}

module.exports = BuildOptimizer;