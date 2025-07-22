let extractedData = {
    title: '',
    authors: '',
    affiliations: '',
    abstract: '',
    conference: '',
    disclosures: '',
    sections: [],
    logo: null,
    logoPosition: 'left',
    headlineSize: 36,
    bodySize: 16,
    layoutStyle: 'single'
};
let currentStep = 1;
let selectedExportFormat = 'standalone';
let uploadedFile = null;
let currentPreviewSize = 'desktop';

// Icon options for sections
const sectionIcons = ['📊', '🔬', '📈', '💊', '🧬', '🩺', '📋', '🔍', '💡', '📌', '🎯', '📝'];

// Color schemes
const colorSchemes = {
    clinical: { primary: '#3498db', secondary: '#2c3e50' },
    research: { primary: '#27ae60', secondary: '#16a085' },
    pharma: { primary: '#8e44ad', secondary: '#6c3483' },
    modern: { primary: '#17a2b8', secondary: '#138496' },
    academic: { primary: '#e74c3c', secondary: '#c0392b' },
    nature: { primary: '#f39c12', secondary: '#d68910' },
    custom: { primary: '#3498db', secondary: '#2c3e50' }
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    // Click to upload
    uploadArea.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragging');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragging');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragging');
        handleFiles(e.dataTransfer.files);
    });

    // Export format selection
    document.querySelectorAll('.export-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.export-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            selectedExportFormat = this.dataset.format;
        });
    });

    // Auto-save on input changes
    document.addEventListener('input', function(e) {
        if (e.target.id && extractedData) {
            updatePreview();
        }
    });
    
    // Initialize font size labels
    document.getElementById('headlineSizeLabel').textContent = '36px';
    document.getElementById('bodySizeLabel').textContent = '16px';
});

function handleFileSelect(e) {
    handleFiles(e.target.files);
}

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        if (validateFile(file)) {
            uploadedFile = file;
            // Immediately start extraction
            extractContent();
        }
    }
}

function validateFile(file) {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF or image file (PNG, JPG, JPEG)');
        return false;
    }
    return true;
}

function extractContent() {
    showLoading(true);
    updateStep(2);
    
    // Check if it's a PDF and we have PDF.js available
    if (uploadedFile && uploadedFile.type === 'application/pdf' && typeof pdfjsLib !== 'undefined') {
        extractPDFContent();
    } else if (uploadedFile && uploadedFile.type.startsWith('image/')) {
        // For images, we can't do OCR in browser
        simulateExtraction();
    } else {
        simulateExtraction();
    }
}

async function extractPDFContent() {
    try {
        // Check if PDF.js is loaded
        if (typeof pdfjsLib === 'undefined') {
            console.error('PDF.js library not loaded');
            throw new Error('PDF.js library not available');
        }
        
        // Update loading title and message
        document.getElementById('loadingTitle').textContent = 'Extracting PDF Content...';
        document.getElementById('loadingMessage').textContent = 'Reading PDF file...';
        
        // Convert file to array buffer
        const arrayBuffer = await uploadedFile.arrayBuffer();
        
        // Load PDF document
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        let fullText = '';
        const totalPages = pdf.numPages;
        
        // Extract text from each page
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            document.getElementById('loadingMessage').textContent = `Extracting page ${pageNum} of ${totalPages}...`;
            
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            console.log(`Page ${pageNum}: ${textContent.items.length} text items`);
            
            // Process text items to handle spacing correctly
            let pageText = '';
            let lastY = null;
            let currentLine = '';
            let lines = [];
            
            // Sort items by Y position (top to bottom) then X position (left to right)
            const sortedItems = textContent.items.sort((a, b) => {
                const yDiff = b.transform[5] - a.transform[5]; // Y decreases from top to bottom
                if (Math.abs(yDiff) > 2) return yDiff;
                return a.transform[4] - b.transform[4]; // X increases from left to right
            });
            
            sortedItems.forEach((item) => {
                const text = item.str;
                if (!text || !text.trim()) return;
                
                const currentY = item.transform[5];
                
                // Check if this is a new line
                if (lastY !== null && Math.abs(currentY - lastY) > 2) {
                    if (currentLine.trim()) {
                        lines.push(currentLine.trim());
                    }
                    currentLine = text;
                } else {
                    // Same line - add space if previous line had content
                    if (currentLine && !currentLine.endsWith(' ') && !text.startsWith(' ')) {
                        currentLine += ' ';
                    }
                    currentLine += text;
                }
                
                lastY = currentY;
            });
            
            // Don't forget the last line
            if (currentLine.trim()) {
                lines.push(currentLine.trim());
            }
            
            // Join lines with newlines
            pageText = lines.join('\n');
            fullText += pageText + '\n\n';
        }
        
        // Parse the extracted text
        document.getElementById('loadingMessage').textContent = 'Analyzing content...';
        
        console.log('Full extracted text length:', fullText.length);
        console.log('First 500 characters:', fullText.substring(0, 500));
        
        parseExtractedText(fullText);
        
        setTimeout(() => {
            showLoading(false);
            showEditor();
            populateSections();
            
            // Count how many sections were extracted
            const extractedSections = extractedData.sections.filter(s => !s.isDetail && s.content).length;
            const detailsExtracted = [
                extractedData.title,
                extractedData.authors,
                extractedData.abstract,
                extractedData.affiliations
            ].filter(content => content).length;
            
            alert(`PDF content extracted!\n\n` +
                  `✓ Found ${detailsExtracted} header fields (title, authors, etc.)\n` +
                  `✓ Found ${extractedSections} content sections\n\n` +
                  `Please review and edit the extracted information as needed. You can:\n` +
                  `• Edit any extracted content\n` +
                  `• Add new sections\n` +
                  `• Reorder sections by dragging\n` +
                  `• Upload images for charts/figures`);
        }, 1000);
        
    } catch (error) {
        console.error('Error extracting PDF:', error);
        // Show error message
        setTimeout(() => {
            alert('Unable to extract text from this PDF. This might be an image-based PDF that requires OCR. Please manually enter your poster content in the editor.');
        }, 1000);
        // Fall back to empty template
        simulateExtraction();
    }
}

function parseExtractedText(text) {
    // Initialize with empty data
    extractedData = {
        title: "",
        authors: "",
        affiliations: "",
        abstract: "",
        conference: "",
        disclosures: "",
        logo: null,
        logoPosition: 'left',
        headlineSize: 36,
        bodySize: 16,
        layoutStyle: 'single',
        sections: []
    };
    
    // Clean up text - preserve line breaks for better parsing
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line);
    
    // Debug log to see what we're working with
    console.log('Extracted text lines:', lines.length);
    console.log('First 10 lines:', lines.slice(0, 10));
    
    // Try to extract title (usually one of the first few lines with substantial text)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
        if (lines[i].length > 30 && lines[i].length < 300 && !lines[i].includes(',')) {
            extractedData.title = lines[i];
            break;
        }
    }
    
    // If no title found, use the first substantial line
    if (!extractedData.title && lines.length > 0) {
        extractedData.title = lines.find(line => line.length > 20) || lines[0];
    }
    
    // Common section headers to look for (excluding abstract since it's a detail field)
    const sectionPatterns = [
        { pattern: /^\s*(introduction|intro)\s*:?\s*$/i, id: 'introduction', title: 'Introduction', icon: '📝' },
        { pattern: /^\s*(background|context)\s*:?\s*$/i, id: 'background', title: 'Background', icon: '🔬' },
        { pattern: /^\s*(aim|aims|objective|objectives|purpose|goal|goals)\s*:?\s*$/i, id: 'objectives', title: 'Objectives', icon: '🎯' },
        { pattern: /^\s*(method|methods|methodology|materials?\s+and\s+methods?)\s*:?\s*$/i, id: 'methods', title: 'Methods', icon: '📊' },
        { pattern: /^\s*(result|results|findings)\s*:?\s*$/i, id: 'results', title: 'Results', icon: '📈' },
        { pattern: /^\s*(discussion|interpretation)\s*:?\s*$/i, id: 'discussion', title: 'Discussion', icon: '💭' },
        { pattern: /^\s*(conclusion|conclusions|summary)\s*:?\s*$/i, id: 'conclusions', title: 'Conclusions', icon: '💡' },
        { pattern: /^\s*(reference|references|bibliography|literature|citations?)\s*:?\s*$/i, id: 'references', title: 'References', icon: '📚' },
        { pattern: /^\s*(acknowledgm?ent|acknowledgm?ents|funding|grant|support)\s*:?\s*$/i, id: 'acknowledgments', title: 'Acknowledgments', icon: '🙏' }
    ];
    
    // Extract abstract for the detail field
    for (let i = 0; i < lines.length; i++) {
        if (/abstract/i.test(lines[i])) {
            let abstractText = '';
            // Collect lines after "Abstract" until we hit another section or reach line limit
            for (let j = i + 1; j < lines.length && j < i + 15; j++) {
                // Stop if we hit another section header
                const nextLine = lines[j];
                const isHeader = sectionPatterns.some(p => p.pattern.test(nextLine)) || 
                               /^[A-Z][A-Z\s]{2,}:?\s*$/.test(nextLine) ||
                               /^(INTRODUCTION|BACKGROUND|METHODS|RESULTS|DISCUSSION|CONCLUSIONS|REFERENCES)/i.test(nextLine);
                
                if (isHeader) {
                    break;
                }
                
                if (nextLine && nextLine.length > 10) {
                    abstractText += nextLine + ' ';
                }
            }
            if (abstractText.trim()) {
                extractedData.abstract = abstractText.trim();
            }
            break;
        }
    }
    
    // Look for authors (lines with multiple commas, often after title)
    const titleIndex = lines.findIndex(line => line === extractedData.title);
    if (titleIndex !== -1) {
        for (let i = titleIndex + 1; i < Math.min(titleIndex + 10, lines.length); i++) {
            if (lines[i].includes(',') && lines[i].length > 20 && lines[i].split(',').length >= 2) {
                // Check if it looks like author names (contains letters and commas)
                if (/[A-Za-z]/.test(lines[i]) && !/\d{4}/.test(lines[i])) {
                    extractedData.authors = lines[i];
                    break;
                }
            }
        }
    }
    
    // Look for affiliations (lines with institution keywords)
    const institutionKeywords = /university|hospital|institute|center|department|school|college|clinic|laboratory/i;
    const affiliationLines = lines.filter(line => 
        institutionKeywords.test(line) && line.length > 20
    ).slice(0, 5);
    if (affiliationLines.length > 0) {
        extractedData.affiliations = affiliationLines.join('; ');
    }
    
    // Look for conference information
    const conferenceKeywords = /presented at|conference|meeting|symposium|congress|annual|poster/i;
    const conferenceLine = lines.find(line => 
        conferenceKeywords.test(line) && line.length > 20
    );
    if (conferenceLine) {
        extractedData.conference = conferenceLine;
    }
    
    // Look for disclosures
    const disclosureKeywords = /disclosure|conflict of interest|funding|grant|support/i;
    const disclosureIndex = lines.findIndex(line => disclosureKeywords.test(line));
    if (disclosureIndex !== -1 && disclosureIndex < lines.length - 1) {
        let disclosureText = '';
        for (let i = disclosureIndex; i < Math.min(disclosureIndex + 5, lines.length); i++) {
            disclosureText += lines[i] + ' ';
        }
        extractedData.disclosures = disclosureText.trim();
    }
    
    // Create standard sections structure (detail fields only)
    const standardSections = [
        {
            id: 'title',
            title: "Title",
            content: extractedData.title,
            icon: '📌',
            hasChart: false,
            editable: true,
            isDetail: true
        },
        {
            id: 'authors',
            title: "Authors",
            content: extractedData.authors,
            icon: '👥',
            hasChart: false,
            editable: true,
            isDetail: true
        },
        {
            id: 'affiliations',
            title: "Affiliations",
            content: extractedData.affiliations,
            icon: '🏛️',
            hasChart: false,
            editable: true,
            isDetail: true
        },
        {
            id: 'abstract',
            title: "Abstract",
            content: extractedData.abstract,
            icon: '📄',
            hasChart: false,
            editable: true,
            isDetail: true
        },
        {
            id: 'conference',
            title: "Conference",
            content: extractedData.conference,
            icon: '🎯',
            hasChart: false,
            editable: true,
            isDetail: true
        },
        {
            id: 'disclosures',
            title: "Disclosures",
            content: extractedData.disclosures,
            icon: '📋',
            hasChart: false,
            editable: true,
            isDetail: true
        }
    ];
    
    // Extract content sections (non-detail sections)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineUpper = line.toUpperCase();
        
        // Check both the original pattern and uppercase versions
        let matched = false;
        
        for (const { pattern, id, title, icon } of sectionPatterns) {
            // Check if line matches pattern or is an all-caps version of the section name
            if (pattern.test(line) || 
                (title.toUpperCase() === lineUpper) ||
                (lineUpper.startsWith(title.toUpperCase()) && lineUpper.length < title.length + 5)) {
                
                // Extract content after the section header
                let sectionContent = '';
                let j = i + 1;
                
                // Continue until we hit another section header or reach the end
                while (j < lines.length && j < i + 50) { // Limit to 50 lines per section
                    const nextLine = lines[j];
                    const nextLineUpper = nextLine.toUpperCase();
                    
                    // Check if we've hit another section header
                    const isNextHeader = sectionPatterns.some(p => 
                        p.pattern.test(nextLine) || 
                        p.title.toUpperCase() === nextLineUpper
                    ) || /^[A-Z][A-Z\s]{2,}:?\s*$/.test(nextLine);
                    
                    if (isNextHeader) {
                        break;
                    }
                    
                    // Add non-empty lines to content
                    if (nextLine && nextLine.length > 5) {
                        sectionContent += nextLine + '\n';
                    }
                    
                    j++;
                }
                
                if (sectionContent.trim()) {
                    // Check if we already have this section
                    const existingSection = standardSections.find(s => s.id.startsWith(id));
                    if (!existingSection) {
                        standardSections.push({
                            id: id + '-' + Date.now(),
                            title: title,
                            content: sectionContent.trim(),
                            icon: icon,
                            hasChart: false,
                            editable: true,
                            isDetail: false
                        });
                    }
                }
                
                matched = true;
                break; // Move to next line
            }
        }
    }
    
    // If no sections found, add empty template sections
    const foundSections = standardSections.filter(s => !s.isDetail);
    if (foundSections.length === 0) {
        const templateSections = [
            { id: 'background-' + Date.now(), title: "Background", content: "", icon: '🔬' },
            { id: 'methods-' + Date.now(), title: "Methods", content: "", icon: '📊' },
            { id: 'results-' + Date.now(), title: "Results", content: "", icon: '📈' },
            { id: 'conclusions-' + Date.now(), title: "Conclusions", content: "", icon: '💡' }
        ];
        
        templateSections.forEach(section => {
            standardSections.push({
                ...section,
                hasChart: false,
                editable: true,
                isDetail: false
            });
        });
    }
    
    extractedData.sections = standardSections;
}

function simulateExtraction() {
    // Reset loading title
    document.getElementById('loadingTitle').textContent = 'Processing poster file...';
    
    // Original simulation code for non-PDF files
    const steps = [
        { message: 'Processing file...' },
        { message: 'Preparing editor structure...' },
        { message: 'Setting up sections...' },
        { message: 'Creating template...' },
        { message: 'Finalizing editor...' }
    ];
    
    let currentIndex = 0;
    
    function processStep() {
        if (currentIndex < steps.length) {
            const step = steps[currentIndex];
            document.getElementById('loadingMessage').textContent = step.message;
            
            setTimeout(() => {
                currentIndex++;
                processStep();
            }, 600);
        } else {
            setTimeout(() => {
                showLoading(false);
                populateExtractedData();
                showEditor();
            }, 500);
        }
    }
    
    processStep();
}

function populateExtractedData() {
    // This function is now only called for non-PDF files
    // Clear all fields and prepare empty structure
    extractedData = {
        title: "",
        authors: "",
        affiliations: "",
        abstract: "",
        conference: "",
        disclosures: "",
        logo: null,
        logoPosition: 'left',
        headlineSize: 36,
        bodySize: 16,
        layoutStyle: 'single',
        sections: []
    };
    
    // Create empty sections structure
    const defaultSections = [
        {
            id: 'title',
            title: "Title",
            content: "",
            icon: '📌',
            hasChart: false,
            editable: true,
            isDetail: true
        },
        {
            id: 'authors',
            title: "Authors",
            content: "",
            icon: '👥',
            hasChart: false,
            editable: true,
            isDetail: true
        },
        {
            id: 'affiliations',
            title: "Affiliations",
            content: "",
            icon: '🏛️',
            hasChart: false,
            editable: true,
            isDetail: true
        },
        {
            id: 'abstract',
            title: "Abstract",
            content: "",
            icon: '📄',
            hasChart: false,
            editable: true,
            isDetail: true
        },
        {
            id: 'conference',
            title: "Conference",
            content: "",
            icon: '🎯',
            hasChart: false,
            editable: true,
            isDetail: true
        },
        {
            id: 'disclosures',
            title: "Disclosures",
            content: "",
            icon: '📋',
            hasChart: false,
            editable: true,
            isDetail: true
        }
    ];
    
    // Add template poster sections
    const suggestedSections = [
        { 
            id: 'background-' + Date.now(),
            title: "Background", 
            content: "",
            icon: '🔬',
            hasChart: false,
            editable: true,
            isDetail: false
        },
        { 
            id: 'methods-' + Date.now(),
            title: "Methods", 
            content: "",
            icon: '📊',
            hasChart: false,
            editable: true,
            isDetail: false
        },
        { 
            id: 'results-' + Date.now(),
            title: "Results", 
            content: "",
            icon: '📈',
            hasChart: false,
            editable: true,
            isDetail: false
        },
        { 
            id: 'conclusions-' + Date.now(),
            title: "Conclusions", 
            content: "",
            icon: '💡',
            hasChart: false,
            editable: true,
            isDetail: false
        }
    ];
    
    extractedData.sections = [...defaultSections, ...suggestedSections];
    
    // Populate sections
    populateSections();
    
    // Show appropriate message
    if (uploadedFile && uploadedFile.type.startsWith('image/')) {
        setTimeout(() => {
            alert('Image uploaded successfully! \n\nNote: Text extraction from images requires OCR technology which is not available in the browser. Please manually enter your poster content in the editor.');
        }, 2000);
    } else {
        setTimeout(() => {
            alert('File processed! Please fill in your poster details in the editor. You can add custom sections and upload images as needed.');
        }, 2000);
    }
}

function populateSections() {
    const container = document.getElementById('sectionsContainer');
    container.innerHTML = '';
    
    extractedData.sections.forEach((section, index) => {
        addSectionToEditor(section, index);
    });
}

function addSectionToEditor(section, index) {
    const container = document.getElementById('sectionsContainer');
    const sectionDiv = document.createElement('div');
    sectionDiv.className = section.isDetail ? 'section-editor sortable-section detail-section' : 'section-editor sortable-section';
    sectionDiv.draggable = true;
    sectionDiv.dataset.index = index;
    
    // Icon selector HTML
    const iconSelectorHTML = sectionIcons.map(icon => 
        `<div class="icon-option ${section.icon === icon ? 'selected' : ''}" onclick="updateSectionIcon(${index}, '${icon}')">${icon}</div>`
    ).join('');
    
    sectionDiv.innerHTML = `
        <span class="drag-handle">☰</span>
        <h4>${section.icon || '📋'} ${section.title}</h4>
        <div class="form-group">
            <label>Section Title</label>
            <input type="text" value="${section.title}" data-section="${index}" data-field="title" onchange="updateSectionData(${index}, 'title', this.value)">
        </div>
        <div class="form-group">
            <label>Section Icon</label>
            <div class="section-icon-selector">
                ${iconSelectorHTML}
            </div>
        </div>
        <div class="form-group">
            <label>Section Content</label>
            <textarea rows="6" data-section="${index}" data-field="content" onchange="updateSectionData(${index}, 'content', this.value)">${section.content}</textarea>
        </div>
        <div class="content-type-selector">
            <label>
                <input type="radio" name="contentType${index}" value="none" ${!section.hasChart ? 'checked' : ''} onchange="updateSectionData(${index}, 'hasChart', false)">
                Text Only
            </label>
            <label>
                <input type="radio" name="contentType${index}" value="chart" ${section.hasChart ? 'checked' : ''} onchange="updateSectionData(${index}, 'hasChart', true)">
                Include Chart/Image
            </label>
        </div>
        ${section.hasChart ? `
        <div class="form-group">
            <label>Chart/Table Data</label>
            <textarea rows="3" placeholder="Enter chart data or description" onchange="updateSectionData(${index}, 'chartData', this.value)">${section.chartData || ''}</textarea>
        </div>
        <div class="form-group image-upload-group">
            <label>Upload Image</label>
            <input type="file" id="sectionImage${index}" accept="image/*" onchange="handleSectionImageUpload(${index}, event)">
            <button class="button secondary" onclick="document.getElementById('sectionImage${index}').click()">
                📷 Upload Image
            </button>
            ${section.image ? `
            <div class="image-preview">
                <img src="${section.image}" alt="Section image">
            </div>
            ` : ''}
        </div>
        ` : ''}
        <div class="section-controls">
            <button class="button danger" onclick="removeSection(${index})">Remove Section</button>
        </div>
    `;
    
    // Add drag and drop event listeners
    sectionDiv.addEventListener('dragstart', handleDragStart);
    sectionDiv.addEventListener('dragover', handleDragOver);
    sectionDiv.addEventListener('drop', handleDrop);
    sectionDiv.addEventListener('dragend', handleDragEnd);
    
    container.appendChild(sectionDiv);
}

// Drag and drop functions for sections
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = e.target.closest('.sortable-section');
    draggedElement.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    const container = document.getElementById('sectionsContainer');
    const afterElement = getDragAfterElement(container, e.clientY);
    if (afterElement == null) {
        container.appendChild(draggedElement);
    } else {
        container.insertBefore(draggedElement, afterElement);
    }
}

function handleDrop(e) {
    e.preventDefault();
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        reorderSections();
    }
}

function handleDragEnd(e) {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.sortable-section:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function reorderSections() {
    const container = document.getElementById('sectionsContainer');
    const sections = container.querySelectorAll('.sortable-section');
    const newOrder = [];
    
    sections.forEach((section, newIndex) => {
        const oldIndex = parseInt(section.dataset.index);
        newOrder.push(extractedData.sections[oldIndex]);
        section.dataset.index = newIndex;
    });
    
    extractedData.sections = newOrder;
    populateSections(); // Repopulate to update indices
    updatePreview();
}

// Icon selection
function updateSectionIcon(index, icon) {
    extractedData.sections[index].icon = icon;
    populateSections();
    updatePreview();
}

// Image upload for sections
function handleSectionImageUpload(index, event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            extractedData.sections[index].image = e.target.result;
            populateSections();
            updatePreview();
        };
        reader.readAsDataURL(file);
    }
}

function updateSectionData(index, field, value) {
    extractedData.sections[index][field] = value;
    if (field === 'hasChart') {
        populateSections(); // Repopulate to show/hide chart field
    }
    // Update header fields if it's a detail section
    if (extractedData.sections[index].isDetail) {
        const section = extractedData.sections[index];
        if (section.id === 'title') extractedData.title = value;
        if (section.id === 'authors') extractedData.authors = value;
        if (section.id === 'affiliations') extractedData.affiliations = value;
        if (section.id === 'abstract') extractedData.abstract = value;
        if (section.id === 'conference') extractedData.conference = value;
        if (section.id === 'disclosures') extractedData.disclosures = value;
    }
    updatePreview();
}

function showEditor() {
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('editorSection').style.display = 'block';
    updateStep(3);
    updatePreview();
}

function updateStep(step) {
    currentStep = step;
    
    for (let i = 1; i <= 4; i++) {
        const stepEl = document.getElementById(`step${i}`);
        if (i < step) {
            stepEl.classList.add('complete');
            stepEl.classList.remove('active');
        } else if (i === step) {
            stepEl.classList.add('active');
            stepEl.classList.remove('complete');
        } else {
            stepEl.classList.remove('active', 'complete');
        }
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById(`${tab}Tab`).style.display = 'block';
}

// Modal functions
function goHome() {
    if (currentStep > 1) {
        document.getElementById('homeConfirmModal').style.display = 'flex';
    }
}

function closeHomeConfirm() {
    document.getElementById('homeConfirmModal').style.display = 'none';
}

function confirmGoHome() {
    closeHomeConfirm();
    // Reset everything
    currentStep = 1;
    extractedData = {
        title: '',
        authors: '',
        affiliations: '',
        abstract: '',
        conference: '',
        disclosures: '',
        sections: [],
        logo: null,
        logoPosition: 'left',
        headlineSize: 36,
        bodySize: 16,
        layoutStyle: 'single'
    };
    document.getElementById('uploadSection').style.display = 'block';
    document.getElementById('editorSection').style.display = 'none';
    document.getElementById('fileInput').value = '';
    updateStep(1);
}

function showInfo() {
    document.getElementById('infoModal').style.display = 'flex';
}

function closeInfo() {
    document.getElementById('infoModal').style.display = 'none';
}

// Logo upload
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            extractedData.logo = e.target.result;
            document.getElementById('logoPreview').innerHTML = `<img src="${e.target.result}" alt="Logo">`;
            document.getElementById('logoPositionGroup').style.display = 'block';
            updatePreview();
        };
        reader.readAsDataURL(file);
    }
}

// Font size controls
function updateFontSizes() {
    const headlineSize = document.getElementById('headlineSize').value;
    const bodySize = document.getElementById('bodySize').value;
    
    document.getElementById('headlineSizeLabel').textContent = `${headlineSize}px`;
    document.getElementById('bodySizeLabel').textContent = `${bodySize}px`;
    
    extractedData.headlineSize = parseInt(headlineSize);
    extractedData.bodySize = parseInt(bodySize);
    
    updatePreview();
}

// Layout style
function updateLayoutStyle() {
    extractedData.layoutStyle = document.getElementById('layoutStyle').value;
    updatePreview();
}

// Screen size preview
function setPreviewSize(size) {
    currentPreviewSize = size;
    const preview = document.querySelector('.website-preview');
    
    // Remove all size classes
    preview.classList.remove('tablet', 'mobile');
    
    // Update buttons
    document.querySelectorAll('.screen-size-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Apply size class
    if (size === 'tablet') {
        preview.classList.add('tablet');
    } else if (size === 'mobile') {
        preview.classList.add('mobile');
    }
}

function updateColorScheme() {
    const scheme = document.getElementById('colorScheme').value;
    const colors = colorSchemes[scheme];
    
    document.getElementById('primaryColor').value = colors.primary;
    document.getElementById('primaryColorHex').value = colors.primary;
    document.getElementById('secondaryColor').value = colors.secondary;
    document.getElementById('secondaryColorHex').value = colors.secondary;
    
    updatePreview();
}

function updateColorInput() {
    document.getElementById('primaryColorHex').value = document.getElementById('primaryColor').value;
    document.getElementById('secondaryColorHex').value = document.getElementById('secondaryColor').value;
    updatePreview();
}

function updateColorPicker() {
    document.getElementById('primaryColor').value = document.getElementById('primaryColorHex').value;
    document.getElementById('secondaryColor').value = document.getElementById('secondaryColorHex').value;
    updatePreview();
}

function updateFontStyle() {
    updatePreview();
}

function updatePreview() {
    const iframe = document.getElementById('websitePreview');
    
    // Get values from sections for header fields
    const titleSection = extractedData.sections.find(s => s.id === 'title');
    const authorsSection = extractedData.sections.find(s => s.id === 'authors');
    const affiliationsSection = extractedData.sections.find(s => s.id === 'affiliations');
    const abstractSection = extractedData.sections.find(s => s.id === 'abstract');
    const conferenceSection = extractedData.sections.find(s => s.id === 'conference');
    const disclosuresSection = extractedData.sections.find(s => s.id === 'disclosures');
    
    const title = titleSection?.content || 'Your Poster Title';
    const authors = authorsSection?.content || '';
    const affiliations = affiliationsSection?.content || '';
    const abstract = abstractSection?.content || '';
    const conference = conferenceSection?.content || '';
    const disclosures = disclosuresSection?.content || '';
    
    const primaryColor = document.getElementById('primaryColor').value;
    const secondaryColor = document.getElementById('secondaryColor').value;
    const fontStyle = document.getElementById('fontStyle').value;
    const headlineSize = extractedData.headlineSize || 36;
    const bodySize = extractedData.bodySize || 16;
    const layoutStyle = extractedData.layoutStyle || 'single';
    
    // Update logo position
    if (document.getElementById('logoPosition')) {
        extractedData.logoPosition = document.getElementById('logoPosition').value;
    }
    
    const fontMap = {
        professional: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        academic: 'Georgia, "Times New Roman", serif',
        modern: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
    };
    
    // Logo HTML
    const logoHTML = extractedData.logo ? `
        <div class="logo-container" style="text-align: ${extractedData.logoPosition}; margin-bottom: 20px;">
            <img src="${extractedData.logo}" alt="Logo" style="max-height: 80px; max-width: 200px;">
        </div>
    ` : '';
    
    // Generate sections HTML based on layout style
    let sectionsHTML = '';
    let navigationHTML = '';
    
    if (layoutStyle === 'sections') {
        navigationHTML = `
            <nav class="section-navigation">
                ${extractedData.sections.filter(s => !s.isDetail).map((section, index) => 
                    `<a href="#section-${index}" class="nav-link">${section.icon} ${section.title}</a>`
                ).join('')}
            </nav>
        `;
    }
    
    sectionsHTML = extractedData.sections.filter(s => !s.isDetail).map((section, index) => {
        const sectionClass = layoutStyle === 'slides' ? 'section slide' : 'section';
        return `
            <div id="section-${index}" class="${sectionClass}">
                <h2>${section.icon} ${section.title}</h2>
                <p>${section.content.replace(/\n/g, '<br>')}</p>
                ${section.hasChart ? `
                <div class="chart-placeholder">
                    ${section.image ? 
                        `<img src="${section.image}" alt="${section.title} image" style="max-width: 100%; height: auto;">` :
                        `<div class="chart-icon">📊</div>
                        <p>${section.chartData || 'Chart visualization would appear here'}</p>`
                    }
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    // Layout-specific styles
    const layoutStyles = {
        single: '',
        sections: `
            .section-navigation {
                position: fixed;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                background: white;
                padding: 20px;
                border-radius: 0 8px 8px 0;
                box-shadow: 2px 0 10px rgba(0,0,0,0.1);
                z-index: 100;
            }
            .nav-link {
                display: block;
                padding: 10px;
                color: ${primaryColor};
                text-decoration: none;
                margin-bottom: 5px;
                border-radius: 4px;
                transition: all 0.3s;
            }
            .nav-link:hover {
                background: ${primaryColor}20;
            }
            html {
                scroll-behavior: smooth;
            }
            .content {
                margin-left: 200px;
            }
        `,
        slides: `
            .section.slide {
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: 60px;
                page-break-after: always;
            }
            .section.slide h2 {
                font-size: ${headlineSize * 1.2}px;
            }
        `
    };
    
    const previewHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: ${fontMap[fontStyle]};
                    margin: 0;
                    padding: 0;
                    background: #f5f5f5;
                    line-height: 1.6;
                    font-size: ${bodySize}px;
                }
                .header {
                    background: ${primaryColor};
                    color: white;
                    padding: 60px 40px;
                    text-align: center;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 40px;
                }
                .content {
                    background: white;
                    padding: 60px;
                    border-radius: 12px;
                    box-shadow: 0 2px 20px rgba(0,0,0,0.1);
                    margin-top: -40px;
                    position: relative;
                }
                h1 {
                    font-size: ${headlineSize}px;
                    margin-bottom: 20px;
                    line-height: 1.2;
                }
                h2 {
                    font-size: ${headlineSize * 0.8}px;
                    color: ${primaryColor};
                    margin-bottom: 20px;
                    border-bottom: 2px solid ${primaryColor};
                    padding-bottom: 10px;
                }
                .authors {
                    font-size: ${bodySize * 1.25}px;
                    opacity: 0.9;
                    margin-bottom: 15px;
                }
                .affiliations {
                    font-size: ${bodySize}px;
                    opacity: 0.8;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .conference {
                    font-size: ${bodySize * 0.9}px;
                    opacity: 0.7;
                    margin-top: 20px;
                }
                .abstract {
                    background: #f8f9fa;
                    padding: 30px;
                    border-radius: 8px;
                    margin-bottom: 40px;
                    border-left: 4px solid ${primaryColor};
                }
                .abstract h2 {
                    color: ${secondaryColor};
                }
                .section {
                    margin-bottom: 40px;
                    padding: 30px;
                    background: #fafbfc;
                    border-radius: 8px;
                }
                .section p {
                    color: #444;
                    margin-bottom: 15px;
                }
                .chart-placeholder {
                    background: white;
                    padding: 40px;
                    border-radius: 8px;
                    text-align: center;
                    margin-top: 20px;
                    border: 2px dashed ${primaryColor};
                }
                .chart-icon {
                    font-size: 48px;
                    margin-bottom: 10px;
                }
                .chart-placeholder p {
                    color: #666;
                    font-style: italic;
                }
                ${layoutStyles[layoutStyle]}
            </style>
        </head>
        <body>
            ${navigationHTML}
            <div class="header">
                <div class="container">
                    ${logoHTML}
                    <h1>${title}</h1>
                    ${authors ? `<div class="authors">${authors}</div>` : ''}
                    ${affiliations ? `<div class="affiliations">${affiliations}</div>` : ''}
                    ${conference ? `<div class="conference">${conference}</div>` : ''}
                </div>
            </div>
            
            <div class="container">
                <div class="content">
                    ${abstract && abstract.trim() ? `
                    <div class="abstract">
                        <h2>📄 Abstract</h2>
                        <p>${abstract}</p>
                    </div>
                    ` : ''}
                    
                    ${sectionsHTML}
                    
                    ${disclosures ? `
                    <div class="section">
                        <h2>📋 Disclosures & Acknowledgments</h2>
                        <p>${disclosures}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        </body>
        </html>
    `;
    
    iframe.srcdoc = previewHTML;
}

function showPreviewModal() {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('fullPreview');
    iframe.srcdoc = document.getElementById('websitePreview').srcdoc;
    modal.style.display = 'flex';
}

function closePreviewModal() {
    document.getElementById('previewModal').style.display = 'none';
}

function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function addSection() {
    const newSection = {
        id: `section-${Date.now()}`,
        title: "New Section",
        content: "Enter section content here...",
        icon: '📋',
        hasChart: false,
        chartData: '',
        image: null,
        editable: true,
        isDetail: false
    };
    extractedData.sections.push(newSection);
    addSectionToEditor(newSection, extractedData.sections.length - 1);
    updatePreview();
}

function removeSection(index) {
    extractedData.sections.splice(index, 1);
    populateSections();
    updatePreview();
}

function exportWebsite() {
    document.getElementById('exportModal').style.display = 'flex';
    updateStep(4);
}

function closeExportModal() {
    document.getElementById('exportModal').style.display = 'none';
}

function downloadWebsite() {
    // Get all the data from sections
    const titleSection = extractedData.sections.find(s => s.id === 'title');
    const authorsSection = extractedData.sections.find(s => s.id === 'authors');
    const affiliationsSection = extractedData.sections.find(s => s.id === 'affiliations');
    const abstractSection = extractedData.sections.find(s => s.id === 'abstract');
    const conferenceSection = extractedData.sections.find(s => s.id === 'conference');
    const disclosuresSection = extractedData.sections.find(s => s.id === 'disclosures');
    
    const data = {
        title: titleSection?.content || '',
        authors: authorsSection?.content || '',
        affiliations: affiliationsSection?.content || '',
        abstract: abstractSection?.content || '',
        conference: conferenceSection?.content || '',
        disclosures: disclosuresSection?.content || '',
        primaryColor: document.getElementById('primaryColor').value,
        secondaryColor: document.getElementById('secondaryColor').value,
        fontStyle: document.getElementById('fontStyle').value,
        headlineSize: extractedData.headlineSize,
        bodySize: extractedData.bodySize,
        layoutStyle: extractedData.layoutStyle,
        logo: extractedData.logo,
        logoPosition: extractedData.logoPosition,
        sections: extractedData.sections
    };
    
    let code = '';
    let filename = '';
    
    if (selectedExportFormat === 'standalone') {
        code = generateStandaloneHTML(data);
        filename = 'poster-website.html';
    } else if (selectedExportFormat === 'react') {
        code = generateReactComponent(data);
        filename = 'PosterWebsite.jsx';
    } else if (selectedExportFormat === 'nextjs') {
        code = generateNextJSPage(data);
        filename = 'poster-page.js';
    }
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    
    alert(`Website code exported successfully as ${filename}!`);
    closeExportModal();
}

function generateStandaloneHTML(data) {
    // [generateStandaloneHTML code here - keeping the same as before]
    const fontMap = {
        professional: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        academic: 'Georgia, "Times New Roman", serif',
        modern: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
    };
    
    // Logo HTML
    const logoHTML = data.logo ? `
        <div class="logo-container" style="text-align: ${data.logoPosition}; margin-bottom: 20px;">
            <img src="${data.logo}" alt="Logo" style="max-height: 80px; max-width: 200px;">
        </div>
    ` : '';
    
    // Generate navigation for sections layout
    let navigationHTML = '';
    if (data.layoutStyle === 'sections') {
        navigationHTML = `
            <nav class="section-navigation">
                ${data.sections.filter(s => !s.isDetail).map((section, index) => 
                    `<a href="#section-${index}" class="nav-link">${section.icon || ''} ${section.title}</a>`
                ).join('')}
            </nav>
        `;
    }
    
    // Generate sections HTML
    const sectionsHTML = data.sections.filter(s => !s.isDetail).map((section, index) => {
        const sectionClass = data.layoutStyle === 'slides' ? 'section slide' : 'section';
        return `
    <div id="section-${index}" class="${sectionClass}">
        <h2>${section.icon || ''} ${section.title}</h2>
        <p>${section.content.replace(/\n/g, '<br>')}</p>
        ${section.hasChart ? `
        <div class="chart-container">
            ${section.image ? 
                `<img src="${section.image}" alt="${section.title} image" style="max-width: 100%; height: auto;">` :
                `<!-- Chart visualization would go here -->
            <p class="chart-description">${section.chartData || 'Chart data'}</p>`
            }
        </div>
        ` : ''}
    </div>
    `;
    }).join('');
    
    // Layout-specific styles
    const layoutStyles = {
        single: '',
        sections: `
.section-navigation {
    position: fixed;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    background: white;
    padding: 20px;
    border-radius: 0 8px 8px 0;
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    z-index: 100;
}

.nav-link {
    display: block;
    padding: 10px;
    color: ${data.primaryColor};
    text-decoration: none;
    margin-bottom: 5px;
    border-radius: 4px;
    transition: all 0.3s;
}

.nav-link:hover {
    background: ${data.primaryColor}20;
}

html {
    scroll-behavior: smooth;
}

.content {
    margin-left: 200px;
}
        `,
        slides: `
.section.slide {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 60px;
    page-break-after: always;
}

.section.slide h2 {
    font-size: ${data.headlineSize * 1.2}px;
}
        `
    };
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><text y=%221em%22 font-size=%2216%22>🖥️</text></svg>">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${fontMap[data.fontStyle]};
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            font-size: ${data.bodySize}px;
        }
        
        .header {
            background: ${data.primaryColor};
            color: white;
            padding: 80px 40px;
            text-align: center;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 40px;
        }
        
        .content {
            background: white;
            padding: 60px;
            border-radius: 12px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
            margin-top: -40px;
            position: relative;
        }
        
        h1 {
            font-size: ${data.headlineSize}px;
            margin-bottom: 20px;
            line-height: 1.2;
        }
        
        h2 {
            font-size: ${data.headlineSize * 0.8}px;
            color: ${data.primaryColor};
            margin-bottom: 25px;
            border-bottom: 2px solid ${data.primaryColor};
            padding-bottom: 15px;
        }
        
        .authors {
            font-size: ${data.bodySize * 1.25}px;
            opacity: 0.9;
            margin-bottom: 15px;
        }
        
        .affiliations {
            font-size: ${data.bodySize}px;
            opacity: 0.8;
            max-width: 900px;
            margin: 0 auto 20px;
            line-height: 1.5;
        }
        
        .conference {
            font-size: ${data.bodySize * 0.9}px;
            opacity: 0.7;
            margin-top: 20px;
        }
        
        .abstract {
            background: #f8f9fa;
            padding: 40px;
            border-radius: 8px;
            margin-bottom: 50px;
            border-left: 4px solid ${data.primaryColor};
        }
        
        .abstract h2 {
            color: ${data.secondaryColor};
        }
        
        .section {
            margin-bottom: 50px;
            padding: 40px;
            background: #fafbfc;
            border-radius: 8px;
            transition: transform 0.3s ease;
        }
        
        .section:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .section p {
            line-height: 1.8;
            color: #444;
            margin-bottom: 20px;
        }
        
        .chart-container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            margin-top: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .footer {
            background: ${data.secondaryColor};
            color: white;
            padding: 40px;
            text-align: center;
            margin-top: 60px;
        }
        
        .disclosures {
            max-width: 900px;
            margin: 0 auto;
            font-size: ${data.bodySize * 0.9}px;
            line-height: 1.6;
            opacity: 0.9;
        }
        
        ${layoutStyles[data.layoutStyle]}
        
        @media (max-width: 768px) {
            h1 {
                font-size: ${data.headlineSize * 0.8}px;
            }
            
            .content {
                padding: 30px;
            }
            
            .section {
                padding: 25px;
            }
            
            .section-navigation {
                display: none;
            }
            
            .content {
                margin-left: 0;
            }
        }
    </style>
</head>
<body>
    ${navigationHTML}
    <div class="header">
        <div class="container">
            ${logoHTML}
            <h1>${data.title}</h1>
            ${data.authors ? `<div class="authors">${data.authors}</div>` : ''}
            ${data.affiliations ? `<div class="affiliations">${data.affiliations}</div>` : ''}
            ${data.conference ? `<div class="conference">${data.conference}</div>` : ''}
        </div>
    </div>
    
    <div class="container">
        <div class="content">
            ${data.abstract ? `
            <div class="abstract">
                <h2>📄 Abstract</h2>
                <p>${data.abstract}</p>
            </div>
            ` : ''}
            
            ${sectionsHTML}
        </div>
    </div>
    
    ${data.disclosures ? `
    <div class="footer">
        <div class="container">
            <h3 style="margin-bottom: 15px;">Disclosures & Acknowledgments</h3>
            <div class="disclosures">${data.disclosures}</div>
        </div>
    </div>
    ` : ''}
</body>
</html>`;
}

function generateReactComponent(data) {
    return `import React from 'react';
import './PosterWebsite.css';

const PosterWebsite = () => {
    const posterData = ${JSON.stringify(data, null, 4)};

    return (
        <div className="poster-website">
            <header className="header" style={{ backgroundColor: posterData.primaryColor }}>
                <div className="container">
                    <h1>{posterData.title}</h1>
                    <div className="authors">{posterData.authors}</div>
                    <div className="affiliations">{posterData.affiliations}</div>
                    <div className="conference">{posterData.conference}</div>
                </div>
            </header>
            
            <main className="container">
                <div className="content">
                    <section className="abstract">
                        <h2>Abstract</h2>
                        <p>{posterData.abstract}</p>
                    </section>
                    
                    {posterData.sections.filter(section => !section.isDetail).map((section, index) => (
                        <section key={index} className="section">
                            <h2>{section.title}</h2>
                            <p dangerouslySetInnerHTML={{ __html: section.content.replace(/\\n/g, '<br>') }} />
                            {section.hasChart && (
                                <div className="chart-container">
                                    <p>{section.chartData}</p>
                                </div>
                            )}
                        </section>
                    ))}
                </div>
            </main>
            
            {posterData.disclosures && (
                <footer className="footer" style={{ backgroundColor: posterData.secondaryColor }}>
                    <div className="container">
                        <h3>Disclosures & Acknowledgments</h3>
                        <div className="disclosures">{posterData.disclosures}</div>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default PosterWebsite;`;
}

function generateNextJSPage(data) {
    return `import Head from 'next/head';
import styles from '../styles/Poster.module.css';

export default function PosterPage() {
    const posterData = ${JSON.stringify(data, null, 4)};

    return (
        <>
            <Head>
                <title>{posterData.title}</title>
                <meta name="description" content={posterData.abstract} />
                <meta property="og:title" content={posterData.title} />
                <meta property="og:description" content={posterData.abstract} />
                <meta name="authors" content={posterData.authors} />
            </Head>

            <div className={styles.posterWebsite}>
                <header className={styles.header} style={{ backgroundColor: posterData.primaryColor }}>
                    <div className={styles.container}>
                        <h1>{posterData.title}</h1>
                        <div className={styles.authors}>{posterData.authors}</div>
                        <div className={styles.affiliations}>{posterData.affiliations}</div>
                        <div className={styles.conference}>{posterData.conference}</div>
                    </div>
                </header>
                
                <main className={styles.container}>
                    <div className={styles.content}>
                        <section className={styles.abstract}>
                            <h2>Abstract</h2>
                            <p>{posterData.abstract}</p>
                        </section>
                        
                        {posterData.sections.filter(section => !section.isDetail).map((section, index) => (
                            <section key={index} className={styles.section}>
                                <h2>{section.title}</h2>
                                <p dangerouslySetInnerHTML={{ __html: section.content.replace(/\\n/g, '<br>') }} />
                                {section.hasChart && (
                                    <div className={styles.chartContainer}>
                                        <p>{section.chartData}</p>
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>
                </main>
                
                {posterData.disclosures && (
                    <footer className={styles.footer} style={{ backgroundColor: posterData.secondaryColor }}>
                        <div className={styles.container}>
                            <h3>Disclosures & Acknowledgments</h3>
                            <div className={styles.disclosures}>{posterData.disclosures}</div>
                        </div>
                    </footer>
                )}
            </div>
        </>
    );
}`;
}

// Initialize drag and drop event handlers
function initializeDragAndDrop() {
    const container = document.getElementById('sectionsContainer');
    if (container) {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
    }
}