# Medical Poster to Website Converter

Transform your medical conference posters into professional, responsive websites in minutes. This web-based tool automatically extracts content from PDF, Word documents, and text files, then creates beautiful, customizable websites that can be easily shared and accessed on any device.

## 🌟 Features

### Core Functionality
- **Multi-Format File Support**: Extract content from PDF, Word (DOCX), and text files
- **Smart Content Organization**: Intelligently identifies sections like Background, Methods, Results, and Conclusions
- **Rich Text Editing**: Format your content with bold, italic, underline, superscript, and lists
- **Advanced Text Control**: Adjust font sizes for all text elements including headers and sections
- **Image Support**: Upload and resize images for both logo and individual sections
- **Responsive Design**: Websites automatically adapt to desktop, tablet, and mobile devices

### Customization Options
- **Multiple Layout Styles**:
  - Single Page Scroll - Traditional scrolling website
  - Section Navigation - Fixed navigation menu with section links
- **Design Controls**:
  - 5 pre-defined color schemes (Clinical, Research, Pharma, Modern, Academic)
  - Custom color picker for primary and secondary colors
  - 3 font styles (Professional, Academic, Modern)
  - Adjustable text sizes for all elements:
    - Title, Authors, Affiliations, Conference details
    - Section titles and content
  - Logo size control (50-200px)
- **Section Management**:
  - Collapsible accordion interface for easy editing
  - Reorder sections with up/down arrows
  - Choose from 16 medical/scientific icons
  - Add unlimited custom sections
  - 4 image size presets (Small, Medium, Large, Full Width)
- **Text Formatting**:
  - Bold, Italic, Underline
  - Superscript for scientific notation
  - Bullet points and numbered lists
  - Available in all text areas

### Export Options
- **Standalone HTML**: Single file ready to deploy
- **React Component**: Modern React with hooks and styled components
- **Next.js Page**: Server-side rendered with SEO optimization

## 🚀 Quick Start

### Option 1: Use Hosted Version
Simply open the `index.html` file in a modern web browser. No installation required!

### Option 2: Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/medical-poster-converter.git

# Navigate to project directory
cd medical-poster-converter

# Open in browser
open index.html
# or use a local server
python -m http.server 8000
# then navigate to http://localhost:8000
```

## 📖 How to Use

### Step 1: Upload Your Poster
- Drag and drop or click to upload your poster file
- Supported formats: PDF, Word (DOCX), Text (TXT), PNG, JPG, JPEG
- For best results, use PDFs with selectable text or formatted Word documents

### Step 2: Review Extracted Content
- The tool automatically extracts text from PDFs
- Content is organized into logical sections
- All extracted content is fully editable

### Step 3: Edit and Customize
#### Content Editing
- Click section headers to expand/collapse
- Use the formatting toolbar for rich text editing:
  - **Bold**, *Italic*, <u>Underline</u>
  - Superscript (e.g., X²)
  - Bullet points and numbered lists
- Adjust text sizes for all elements
- Upload images for individual sections
- Reorder sections using arrow buttons

#### Design Customization
- Switch to the Design tab
- Upload a logo/institution image
- Choose or customize color schemes
- Select font styles
- Adjust text sizes

### Step 4: Preview and Export
- Use the live preview to see changes in real-time
- Click "Full Preview" to test on different devices
- Export your website in your preferred format

## 🛠️ Technical Details

### Technologies Used
- **Frontend**: Pure HTML5, CSS3, and Vanilla JavaScript
- **PDF Processing**: PDF.js v2.11.338
- **Word Processing**: Basic DOCX support (mammoth.js compatible)
- **No Backend Required**: Runs entirely in the browser
- **No Dependencies**: Self-contained application

### Browser Compatibility
- Chrome/Edge (Recommended)
- Firefox
- Safari
- Opera

*Note: Requires a modern browser with JavaScript enabled*

### File Structure
```
medical-poster-converter/
│
├── index.html          # Main application file
├── style.css          # Embedded styles (within HTML)
├── script.js          # Embedded JavaScript (within HTML)
└── README.md          # This file
```

## 📋 Supported Input Formats

### PDF Files
- Best results with text-based PDFs
- Automatically extracts title, authors, affiliations
- Identifies common section headers
- Preserves paragraph structure

### Word Documents (DOCX)
- Supports modern Word documents
- Basic text extraction available
- Manual formatting adjustments may be needed
- For enhanced Word support, consider integrating [mammoth.js](https://github.com/mwilliamson/mammoth.js)

### Text Files (TXT)
- Plain text format support
- Ideal for simple content
- Automatic section detection

### Image Files (PNG, JPG, JPEG)
- Useful for poster screenshots
- Manual content entry required
- Full editing capabilities available

## 🎨 Customization Guide

### Color Schemes
1. **Clinical Blue**: Professional medical aesthetic
2. **Research Green**: Academic and scientific feel
3. **Pharma Purple**: Pharmaceutical industry style
4. **Modern Teal**: Contemporary and fresh
5. **Academic Red**: Traditional scholarly appearance
6. **Custom**: Create your own color combination

### Section Icons
Choose from 16 medical and scientific icons:
🔬 🧪 📊 💡 🎯 📈 🧬 💊 🔍 📋 🏥 ⚕️ 🧫 🩺 📐 💉

### Image Sizing Options
- **Small**: 300px - For supplementary images
- **Medium**: 500px - Default, balanced size
- **Large**: 800px - For important visuals
- **Full Width**: 100% - Maximum impact

## 💡 Tips for Best Results

### PDF Preparation
- Use high-quality PDFs with selectable text
- Ensure clear section headers in your poster
- Avoid scanned images or handwritten content

### Content Organization
- Keep section titles clear and concise
- Use the formatting toolbar for emphasis
- Add images to break up text sections

### Design Considerations
- Choose colors that match your institution's branding
- Ensure sufficient contrast for readability
- Test on multiple devices before sharing

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
1. Maintain browser compatibility
2. Keep the application self-contained
3. Test thoroughly on different devices
4. Document any new features

## 📄 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2024 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- **PDF.js** - Mozilla's JavaScript PDF reader
- **Medical/Scientific Icons** - Unicode emoji standard
- **Design Inspiration** - Modern medical conference websites

## 📞 Support

For issues, questions, or suggestions:
1. Check the [Issues](https://github.com/yourusername/medical-poster-converter/issues) page
2. Create a new issue with detailed information
3. Include browser version and sample files if applicable

## 🚀 Future Enhancements

Potential features for future versions:
- [ ] Enhanced Word document processing with full formatting preservation
- [ ] OCR support for image-based PDFs
- [ ] Multiple poster templates
- [ ] Direct publishing to GitHub Pages
- [ ] QR code generation for easy sharing
- [ ] Analytics integration
- [ ] Multi-language support
- [ ] Collaborative editing
- [ ] Version history
- [ ] Export to PowerPoint format

---

Made with ❤️ for the medical and scientific community. Transform your research into accessible, beautiful websites!