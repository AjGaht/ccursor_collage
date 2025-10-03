class PropertyCollageCreator {
    constructor() {
        this.uploadedImages = [];
        this.agentPhoto = null;
        this.canvas = null;
        this.ctx = null;
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.imageInput = document.getElementById('imageInput');
        this.imagePreview = document.getElementById('imagePreview');
        this.propertyForm = document.getElementById('propertyForm');
        this.agentForm = document.getElementById('agentForm');
        this.generateBtn = document.getElementById('generateBtn');
        this.collageSection = document.getElementById('collageSection');
        this.canvas = document.getElementById('collageCanvas');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.newCollageBtn = document.getElementById('newCollageBtn');
        this.agentPhotoInput = document.getElementById('agentPhoto');
    }

    setupEventListeners() {
        // Upload area events
        this.uploadArea.addEventListener('click', () => this.imageInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        
        // File input events
        this.imageInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.agentPhotoInput.addEventListener('change', this.handleAgentPhotoSelect.bind(this));
        
        // Button events
        this.generateBtn.addEventListener('click', this.generateCollage.bind(this));
        this.downloadBtn.addEventListener('click', this.downloadCollage.bind(this));
        this.newCollageBtn.addEventListener('click', this.resetForm.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    handleAgentPhotoSelect(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.agentPhoto = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    processFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            this.showError('Please select valid image files.');
            return;
        }

        if (imageFiles.length > 3) {
            this.showError('Please select maximum 3 images.');
            return;
        }

        this.uploadedImages = [];
        imageFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.uploadedImages.push({
                    src: event.target.result,
                    name: file.name
                });
                this.updateImagePreview();
            };
            reader.readAsDataURL(file);
        });
    }

    updateImagePreview() {
        this.imagePreview.innerHTML = '';
        
        this.uploadedImages.forEach((image, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            const img = document.createElement('img');
            img.src = image.src;
            img.alt = image.name;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = () => this.removeImage(index);
            
            previewItem.appendChild(img);
            previewItem.appendChild(removeBtn);
            this.imagePreview.appendChild(previewItem);
        });
    }

    removeImage(index) {
        this.uploadedImages.splice(index, 1);
        this.updateImagePreview();
    }

    async generateCollage() {
        if (this.uploadedImages.length === 0) {
            this.showError('Please upload at least one image.');
            return;
        }

        if (!this.validateForms()) {
            return;
        }

        this.generateBtn.innerHTML = '<span class="loading"></span> Generating...';
        this.generateBtn.disabled = true;

        try {
            await this.createCollage();
            this.collageSection.style.display = 'block';
            this.collageSection.scrollIntoView({ behavior: 'smooth' });
            this.showSuccess('Collage generated successfully!');
        } catch (error) {
            this.showError('Error generating collage: ' + error.message);
        } finally {
            this.generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Collage';
            this.generateBtn.disabled = false;
        }
    }

    validateForms() {
        const requiredFields = [
            'price', 'bedrooms', 'bathrooms', 'area', 'propertyType', 'address',
            'agentName', 'company', 'phone'
        ];

        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                this.showError(`Please fill in the ${fieldId} field.`);
                field.focus();
                return false;
            }
        }

        return true;
    }

    async createCollage() {
        const canvasWidth = 800;
        const canvasHeight = 1000;
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.ctx = this.canvas.getContext('2d');

        // Fill background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw main image (top 60% of canvas)
        const mainImageHeight = Math.floor(canvasHeight * 0.6);
        await this.drawMainImage(canvasWidth, mainImageHeight);

        // Draw smaller images (next 20% of canvas)
        const smallImagesY = mainImageHeight;
        const smallImagesHeight = Math.floor(canvasHeight * 0.2);
        await this.drawSmallImages(canvasWidth, smallImagesHeight, smallImagesY);

        // Draw property details and agent info (bottom 20% of canvas)
        const detailsY = mainImageHeight + smallImagesHeight;
        const detailsHeight = canvasHeight - detailsY;
        this.drawPropertyDetails(canvasWidth, detailsHeight, detailsY);
        this.drawAgentInfo(canvasWidth, detailsHeight, detailsY);
    }

    async drawMainImage(width, height) {
        if (this.uploadedImages.length === 0) return;

        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = this.uploadedImages[0].src;
        });

        // Draw main image
        this.ctx.drawImage(img, 0, 0, width, height);

        // Draw price overlay
        this.drawPriceOverlay(width);
    }

    async drawSmallImages(width, height, y) {
        if (this.uploadedImages.length < 2) return;

        const imageWidth = Math.floor(width / 2);
        
        for (let i = 1; i < Math.min(3, this.uploadedImages.length); i++) {
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = this.uploadedImages[i].src;
            });

            const x = (i - 1) * imageWidth;
            this.ctx.drawImage(img, x, y, imageWidth, height);
        }
    }

    drawPriceOverlay(width) {
        const listingType = document.getElementById('listingType').value;
        const price = document.getElementById('price').value;
        const priceUnit = document.getElementById('priceUnit').value;
        
        const overlayWidth = 200;
        const overlayHeight = 80;
        const x = 20;
        const y = 20;

        // Draw overlay background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.roundRect(x, y, overlayWidth, overlayHeight, 10);
        this.ctx.fill();

        // Draw text
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(listingType.toUpperCase(), x + 15, y + 30);

        this.ctx.font = '16px Arial';
        const priceText = `AED ${this.formatPrice(price)}${priceUnit}`;
        this.ctx.fillText(priceText, x + 15, y + 55);
    }

    drawPropertyDetails(width, height, y) {
        const bedrooms = document.getElementById('bedrooms').value;
        const bathrooms = document.getElementById('bathrooms').value;
        const area = document.getElementById('area').value;
        const propertyType = document.getElementById('propertyType').value;
        const address = document.getElementById('address').value;

        // Draw property specs
        const specsY = y + 20;
        this.drawPropertySpecs(width, specsY, bedrooms, bathrooms, area, propertyType);

        // Draw address
        const addressY = specsY + 50;
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        
        const lines = this.wrapText(address, width - 40, this.ctx);
        lines.forEach((line, index) => {
            this.ctx.fillText(line, 20, addressY + (index * 20));
        });
    }

    drawPropertySpecs(width, y, bedrooms, bathrooms, area, propertyType) {
        const specs = [
            { icon: '🛏️', text: bedrooms },
            { icon: '🛁', text: bathrooms },
            { icon: '📐', text: `${area} ft²` },
            { icon: '🏠', text: propertyType }
        ];

        const specWidth = width / 4;
        
        specs.forEach((spec, index) => {
            const x = index * specWidth;
            
            this.ctx.fillStyle = '#000000';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            
            // Draw icon and text
            this.ctx.fillText(spec.icon, x + specWidth/2, y + 15);
            this.ctx.fillText(spec.text, x + specWidth/2, y + 35);
        });
    }

    drawAgentInfo(width, height, y) {
        const agentName = document.getElementById('agentName').value;
        const company = document.getElementById('company').value;
        const phone = document.getElementById('phone').value;

        const agentInfoX = width - 250;
        const agentInfoY = y + 20;

        // Draw agent text info
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(agentName, agentInfoX, agentInfoY);

        this.ctx.font = '14px Arial';
        this.ctx.fillText(company, agentInfoX, agentInfoY + 20);
        this.ctx.fillText(phone, agentInfoX, agentInfoY + 40);

        // Draw agent photo if available
        if (this.agentPhoto) {
            this.drawAgentPhoto(agentInfoX + 200, agentInfoY - 10);
        }
    }

    async drawAgentPhoto(x, y) {
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = this.agentPhoto;
        });

        // Draw circular agent photo
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x + 25, y + 25, 25, 0, Math.PI * 2);
        this.ctx.clip();
        this.ctx.drawImage(img, x, y, 50, 50);
        this.ctx.restore();
    }

    formatPrice(price) {
        return new Intl.NumberFormat('en-US').format(price);
    }

    wrapText(text, maxWidth, ctx) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    downloadCollage() {
        const link = document.createElement('a');
        link.download = 'property-collage.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }

    resetForm() {
        this.uploadedImages = [];
        this.agentPhoto = null;
        this.imagePreview.innerHTML = '';
        this.propertyForm.reset();
        this.agentForm.reset();
        this.collageSection.style.display = 'none';
        this.imageInput.value = '';
        this.agentPhotoInput.value = '';
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
        messageDiv.textContent = message;

        const container = document.querySelector('.main-content');
        container.insertBefore(messageDiv, container.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Add roundRect method to CanvasRenderingContext2D if not available
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PropertyCollageCreator();
});