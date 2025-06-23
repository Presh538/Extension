//
//
// Job Application Assistant - Popup Script
//
//

// At the top of the file, set workerSrc if available
if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.js';
}

class PopupManager {
    constructor() {
        this.port = chrome.runtime.connect({ name: "popup-port" });
        this.pendingRequests = new Map();
        this.init();
    }

    async init() {
        this.setupConnection();
        this.initTabs();
        this.initModal();
        await this.initializeDocuments();
        await this.initializeSettings();
        await this.renderAnalysis();
    }

    setupConnection() {
        this.port.onMessage.addListener(response => {
            const callback = this.pendingRequests.get(response.requestId);
            if (callback) {
                callback(response);
                this.pendingRequests.delete(response.requestId);
            } else if (response.action === 'storageChanged') {
                // Handle live updates from background
                if (response.key === 'skills') {
                    this.renderSkills(response.value);
                } else if (response.key === 'resume') {
                    this.checkResumeState();
                } else if (response.key === 'history') {
                    this.renderAnalysis();
                }
            }
        });

        this.port.onDisconnect.addListener(() => {
            console.error("Popup port disconnected.");
            // Optionally disable UI elements
        });
    }

    sendMessage(action, data = {}) {
        return new Promise((resolve, reject) => {
            if (!this.port) return reject(new Error('Extension not connected.'));
            
            const requestId = Date.now() + Math.random();
            this.pendingRequests.set(requestId, resolve);
            
            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error(`Request timed out for action: ${action}`));
                }
            }, 10000); // 10 second timeout

            this.port.postMessage({ action, data, requestId });
        });
    }

    initTabs() {
        const tabs = document.querySelectorAll('.tab-link');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
                document.querySelectorAll('.tab-link').forEach(link => link.classList.remove('active'));
                document.getElementById(tabName).style.display = 'block';
                tab.classList.add('active');
            });
        });
        if(document.getElementById('defaultOpen')) {
            document.getElementById('defaultOpen').click();
        }
    }

    initModal() {
        this.modal = document.getElementById('history-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalTextContent = document.getElementById('modal-text-content');
        const closeButton = this.modal.querySelector('.close-button');

        closeButton.addEventListener('click', () => this.modal.style.display = 'none');
        window.addEventListener('click', (event) => {
            if (event.target == this.modal) this.modal.style.display = 'none';
        });
    }

    showHistoryModal(title, content) {
        this.modalTitle.textContent = title;
        this.modalTextContent.textContent = content;
        this.modal.style.display = 'block';
    }

    async initializeDocuments() {
        this.resumeUploadInput = document.getElementById('resume-upload');
        this.uploadBox = document.querySelector('.upload-box');
        this.fileName = document.getElementById('file-name');
        this.addSkillBtn = document.getElementById('add-skill-btn');
        this.skillInput = document.getElementById('skill-input');
        this.skillsList = document.getElementById('skills-list');

        // Welcome screen upload handling
        const welcomeUploadBox = document.getElementById('welcome-upload-box');
        const welcomeUploadBtn = document.getElementById('welcome-upload-btn');
        
        if (welcomeUploadBox) {
            this.setupDragAndDrop(welcomeUploadBox, this.resumeUploadInput);
            welcomeUploadBtn.addEventListener('click', () => this.resumeUploadInput.click());
        }

        // Main UI upload handling
        const resumeUploadBox = document.getElementById('resume-upload-box');
        const resumeUploadBtn = document.getElementById('resume-upload-btn');
        
        if (resumeUploadBox) {
            this.setupDragAndDrop(resumeUploadBox, this.resumeUploadInput);
            resumeUploadBtn.addEventListener('click', () => this.resumeUploadInput.click());
        }

        this.resumeUploadInput.addEventListener('change', (e) => this.handleFile(e.target.files[0]));
        document.getElementById('change-file-btn').addEventListener('click', () => this.resumeUploadInput.click());
        document.getElementById('delete-file-btn').addEventListener('click', () => this.deleteResume());
        
        this.addSkillBtn.addEventListener('click', () => this.addSkill());
        this.skillInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addSkill();
        });

        await this.checkResumeState();
        const { data: skills } = await this.sendMessage('getData', { key: 'skills' });
        this.renderSkills(skills || []);
        this.renderResumeHistory();
    }

    setupDragAndDrop(uploadBox, fileInput) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadBox.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadBox.addEventListener(eventName, () => {
                uploadBox.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadBox.addEventListener(eventName, () => {
                uploadBox.classList.remove('dragover');
            });
        });

        uploadBox.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });
    }

    async checkResumeState() {
        const { data: resume } = await this.sendMessage('getData', { key: 'resume' });
        const welcomeScreen = document.getElementById('welcome-screen');
        const mainContent = document.getElementById('main-content');
        
        if (resume && resume.name) {
            welcomeScreen.style.display = 'none';
            mainContent.style.display = 'block';
            this.showUploadSuccess(resume.name);
        } else {
            welcomeScreen.style.display = 'block';
            mainContent.style.display = 'none';
            this.showUploadDefault();
        }
    }

    showUploadDefault() {
        const uploadBoxes = document.querySelectorAll('.upload-box');
        uploadBoxes.forEach(box => {
            box.classList.remove('uploading', 'uploaded');
            const content = box.querySelector('.upload-content');
            const progress = box.querySelector('.upload-progress');
            const success = box.querySelector('.upload-success');
            
            if (content) content.style.display = 'flex';
            if (progress) progress.style.display = 'none';
            if (success) success.style.display = 'none';
        });
    }

    showUploadProgress() {
        const uploadBoxes = document.querySelectorAll('.upload-box');
        uploadBoxes.forEach(box => {
            box.classList.add('uploading');
            box.classList.remove('uploaded');
            const content = box.querySelector('.upload-content');
            const progress = box.querySelector('.upload-progress');
            const success = box.querySelector('.upload-success');
            
            if (content) content.style.display = 'none';
            if (progress) progress.style.display = 'flex';
            if (success) success.style.display = 'none';
        });
    }

    showUploadSuccess(fileName) {
        const uploadBoxes = document.querySelectorAll('.upload-box');
        uploadBoxes.forEach(box => {
            box.classList.add('uploaded');
            box.classList.remove('uploading');
            const content = box.querySelector('.upload-content');
            const progress = box.querySelector('.upload-progress');
            const success = box.querySelector('.upload-success');
            const fileNameElement = box.querySelector('.file-name');
            
            if (content) content.style.display = 'none';
            if (progress) progress.style.display = 'none';
            if (success) success.style.display = 'flex';
            if (fileNameElement) fileNameElement.textContent = fileName;
        });
    }

    updateProgress(percent) {
        const progressTexts = document.querySelectorAll('.progress-text');
        const progressCircles = document.querySelectorAll('.progress-ring-circle');
        
        progressTexts.forEach(text => {
            text.textContent = `${percent}%`;
        });
        
        progressCircles.forEach(circle => {
            const circumference = 2 * Math.PI * 26; // r=26
            const offset = circumference - (percent / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        });
    }

    async handleFile(file) {
        if (!file) {
            alert('Please select a file to upload.');
            return;
        }
        const allowedTypes = ['.txt', '.pdf'];
        const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        if (!allowedTypes.includes(ext)) {
            alert('Unsupported file type. Please upload a .txt or .pdf file.');
            return;
        }
        this.showUploadProgress();
        let resumeText = '';
        if (ext === '.txt') {
            // Handle .txt files as before
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 90) progress = 90;
                this.updateProgress(Math.round(progress));
            }, 200);
            const reader = new FileReader();
            reader.onload = async (event) => {
                clearInterval(progressInterval);
                this.updateProgress(100);
                setTimeout(async () => {
                    resumeText = event.target.result;
                    await this.saveResume(file, resumeText);
                }, 500);
            };
            reader.readAsText(file);
        } else if (ext === '.pdf') {
            // Handle PDF files
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let textContent = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const pageText = content.items.map(item => item.str).join(' ');
                    textContent += pageText + '\n';
                    this.updateProgress(Math.round((i / pdf.numPages) * 100));
                }
                resumeText = textContent;
                await this.saveResume(file, resumeText);
            } catch (err) {
                alert('Failed to parse PDF file. Please try another file or use a .txt resume.');
                this.showUploadDefault();
                return;
            }
        }
    }

    async saveResume(file, resumeText) {
        const resumeObj = {
            name: file.name,
            content: resumeText,
            uploadedAt: new Date().toISOString()
        };
        await this.sendMessage('saveData', { key: 'resume', value: resumeObj });
        const { data: resumeHistory } = await this.sendMessage('getData', { key: 'resumeHistory' });
        const updatedHistory = Array.isArray(resumeHistory) ? [resumeObj, ...resumeHistory] : [resumeObj];
        await this.sendMessage('saveData', { key: 'resumeHistory', value: updatedHistory });
        this.showUploadSuccess(file.name);
        this.checkResumeState();
        this.renderResumeHistory();
    }
    
    async deleteResume() {
        if (confirm('Are you sure you want to delete your resume?')) {
            await this.sendMessage('saveData', { key: 'resume', value: null });
            this.checkResumeState();
        }
    }

    renderSkills(skills = []) {
        this.skillsList.innerHTML = '';
        skills.forEach(skill => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${skill}</span><button class="delete-skill">&times;</button>`;
            li.querySelector('.delete-skill').addEventListener('click', async () => {
                const { data: currentSkills } = await this.sendMessage('getData', { key: 'skills' });
                const updatedSkills = (currentSkills || []).filter(s => s !== skill);
                await this.sendMessage('saveData', { key: 'skills', value: updatedSkills });
            });
            this.skillsList.appendChild(li);
        });
    }

    async addSkill() {
        const skill = this.skillInput.value.trim();
        if (skill) {
            const { data: currentSkills } = await this.sendMessage('getData', { key: 'skills' });
            const updatedSkills = [...(currentSkills || []), skill];
            await this.sendMessage('saveData', { key: 'skills', value: updatedSkills });
            this.skillInput.value = '';
        }
    }
    
    async renderAnalysis() {
        const analysisList = document.getElementById('analysis-list');
        if (!analysisList) return;
        analysisList.innerHTML = '<li>Loading history...</li>';
        
        // Calculate and display profile completeness
        await this.updateProfileCompleteness();
        
        try {
            const { data: history } = await this.sendMessage('getHistory');
            analysisList.innerHTML = '';
            if (history && history.length > 0) {
                history.forEach(item => {
                    const li = document.createElement('li');
                    li.className = 'history-list-item';
                    const title = item.jobDetails?.title || 'Item';
                    const typeLabel = item.type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                    li.innerHTML = `<div class="history-item-main"><strong>${typeLabel}: ${title}</strong></div>`;
                    const viewButton = document.createElement('button');
                    viewButton.textContent = 'View';
                    viewButton.className = 'view-history-btn';
                    viewButton.addEventListener('click', () => this.showHistoryModal(title, item.content));
                    li.appendChild(viewButton);
                    analysisList.appendChild(li);
                });
            } else {
                analysisList.innerHTML = '<li>No history yet.</li>';
            }
        } catch (error) {
            analysisList.innerHTML = '<li>Error loading history.</li>';
        }
    }

    async updateProfileCompleteness() {
        // Get user data
        const { data: resume } = await this.sendMessage('getData', { key: 'resume' });
        const { data: skills } = await this.sendMessage('getData', { key: 'skills' });
        const { data: experience } = await this.sendMessage('getData', { key: 'experience' });

        // Calculate completeness percentages
        const resumeCompleteness = resume && resume.name ? 100 : 0;
        const skillsCompleteness = skills && skills.length > 0 ? Math.min(100, skills.length * 10) : 0; // 10% per skill, max 100%
        const experienceCompleteness = experience && experience.length > 0 ? Math.min(100, experience.length * 25) : 0; // 25% per experience, max 100%

        // Update progress rings
        this.updateCompletenessRing('resume-completeness', resumeCompleteness);
        this.updateCompletenessRing('skills-completeness', skillsCompleteness);
        this.updateCompletenessRing('experience-completeness', experienceCompleteness);

        // Update labels
        this.updateCompletenessLabel('resume-completeness', resumeCompleteness, 'Resume', 
            resumeCompleteness > 0 ? 'Resume uploaded successfully' : 'Upload your resume to get started');
        this.updateCompletenessLabel('skills-completeness', skillsCompleteness, 'Skills', 
            skillsCompleteness > 0 ? `${skills.length} skills added` : 'Add your key skills and expertise');
        this.updateCompletenessLabel('experience-completeness', experienceCompleteness, 'Experience', 
            experienceCompleteness > 0 ? `${experience.length} experiences added` : 'Add your work experience');
    }

    updateCompletenessRing(elementId, percentage) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const ring = element.parentElement.querySelector('.completeness-ring-progress');
        if (ring) {
            const circumference = 2 * Math.PI * 26; // r=26
            const offset = circumference - (percentage / 100) * circumference;
            ring.style.strokeDashoffset = offset;
        }

        element.textContent = `${percentage}%`;
    }

    updateCompletenessLabel(elementId, percentage, title, description) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const label = element.parentElement.parentElement.querySelector('.completeness-label');
        if (label) {
            const titleElement = label.querySelector('h4');
            const descElement = label.querySelector('p');
            
            if (titleElement) titleElement.textContent = title;
            if (descElement) descElement.textContent = description;
        }
    }

    async initializeSettings() {
        const apiKeyInput = document.getElementById('api-key');
        const saveApiKeyBtn = document.getElementById('save-api-key');

        const { data: apiKey } = await this.sendMessage('getData', { key: 'aiApiKey' });
        if (apiKey) apiKeyInput.value = apiKey;

        if (saveApiKeyBtn) {
            saveApiKeyBtn.addEventListener('click', async () => {
                await this.sendMessage('saveData', { key: 'aiApiKey', value: apiKeyInput.value.trim() });
                alert('API Key Saved!');
            });
        }
    }

    async renderResumeHistory() {
        const historySection = document.getElementById('resume-history-section');
        if (!historySection) return;
        const { data: resumeHistory } = await this.sendMessage('getData', { key: 'resumeHistory' });
        if (!Array.isArray(resumeHistory) || resumeHistory.length === 0) {
            historySection.innerHTML = '<p class="empty-history">No previous resumes uploaded.</p>';
            return;
        }
        historySection.innerHTML = '<h4>Resume History</h4>';
        const list = document.createElement('ul');
        list.className = 'resume-history-list';
        resumeHistory.forEach((resume, idx) => {
            const li = document.createElement('li');
            li.className = 'resume-history-item';
            li.innerHTML = `<span class="resume-history-name">${resume.name}</span> <span class="resume-history-date">${new Date(resume.uploadedAt).toLocaleString()}</span>`;
            const viewBtn = document.createElement('button');
            viewBtn.textContent = 'View';
            viewBtn.className = 'action-btn secondary';
            viewBtn.addEventListener('click', () => {
                this.showHistoryModal(resume.name, resume.content);
            });
            const setActiveBtn = document.createElement('button');
            setActiveBtn.textContent = 'Set as Active';
            setActiveBtn.className = 'action-btn';
            setActiveBtn.addEventListener('click', async () => {
                await this.sendMessage('saveData', { key: 'resume', value: resume });
                this.checkResumeState();
                alert('This resume is now active!');
            });
            li.appendChild(viewBtn);
            li.appendChild(setActiveBtn);
            list.appendChild(li);
        });
        historySection.appendChild(list);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
}); 