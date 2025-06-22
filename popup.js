// Popup JavaScript for Job Application Assistant

class PopupManager {
  constructor() {
    this.currentTab = 'documents';
    this.documents = {};
    this.skills = [];
    this.experience = [];
    this.education = [];
    this.preferences = {};
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadData();
    this.renderUI();
    this.renderPortfolio();
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // File uploads - Resume (with focus preservation)
    document.getElementById('resume-file').addEventListener('change', (e) => {
      this.handleFileUpload(e, 'resume');
    });
    document.getElementById('resume-upload-btn').addEventListener('click', (e) => {
      e.preventDefault(); // Prevent popup from closing
      document.getElementById('resume-file').click();
    });
    document.getElementById('resume-replace-btn').addEventListener('click', (e) => {
      e.preventDefault(); // Prevent popup from closing
      document.getElementById('resume-file').click();
    });

    // Portfolio URL management
    document.getElementById('save-portfolio-btn').addEventListener('click', () => {
      this.savePortfolio();
    });
    document.getElementById('portfolio-edit-btn').addEventListener('click', () => {
      this.editPortfolio();
    });
    document.getElementById('portfolio-url').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.savePortfolio();
      }
    });

    // Skills management
    document.getElementById('add-skill-btn').addEventListener('click', () => {
      this.addSkill();
    });

    document.getElementById('skill-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addSkill();
      }
    });

    // Experience and Education
    document.getElementById('add-experience-btn').addEventListener('click', () => {
      this.openModal('experience-modal');
    });

    document.getElementById('add-education-btn').addEventListener('click', () => {
      this.openModal('education-modal');
    });

    // Modal buttons - Experience
    document.getElementById('experience-close-btn').addEventListener('click', () => {
      this.closeModal('experience-modal');
    });
    document.getElementById('experience-cancel-btn').addEventListener('click', () => {
      this.closeModal('experience-modal');
    });
    document.getElementById('experience-save-btn').addEventListener('click', () => {
      this.saveExperience();
    });

    // Modal buttons - Education
    document.getElementById('education-close-btn').addEventListener('click', () => {
      this.closeModal('education-modal');
    });
    document.getElementById('education-cancel-btn').addEventListener('click', () => {
      this.closeModal('education-modal');
    });
    document.getElementById('education-save-btn').addEventListener('click', () => {
      this.saveEducation();
    });

    // Settings
    document.querySelectorAll('#settings-tab input, #settings-tab select').forEach(input => {
      input.addEventListener('change', () => {
        this.savePreferences();
      });
    });

    // Data management
    document.getElementById('export-data-btn').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('import-data-btn').addEventListener('click', () => {
      this.importData();
    });

    document.getElementById('clear-data-btn').addEventListener('click', () => {
      this.clearData();
    });

    // Help button
    document.getElementById('help-btn').addEventListener('click', () => {
      this.showHelp();
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    this.currentTab = tabName;
  }

  async loadData() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getDocuments' });
      if (response.success) {
        this.documents = response.data;
        this.skills = response.data.skills || [];
        this.experience = response.data.experience || [];
        this.education = response.data.education || [];
      }

      const prefsResponse = await chrome.runtime.sendMessage({ action: 'getPreferences' });
      if (prefsResponse.success) {
        this.preferences = prefsResponse.data;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  renderUI() {
    this.renderDocuments();
    this.renderSkills();
    this.renderExperience();
    this.renderEducation();
    this.renderPreferences();
    this.renderAnalysis();
  }

  renderDocuments() {
    // Resume
    if (this.documents.resume) {
      document.getElementById('resume-upload').querySelector('.upload-area').style.display = 'none';
      document.getElementById('resume-info').style.display = 'flex';
      document.getElementById('resume-name').textContent = this.documents.resume.filename;
      document.getElementById('resume-date').textContent = `Last updated: ${this.formatDate(this.documents.resume.lastUpdated)}`;
      
      // Add file type indicator
      const resumeName = document.getElementById('resume-name');
      if (this.documents.resume.content && typeof this.documents.resume.content === 'object') {
        resumeName.textContent = `${this.documents.resume.filename} (${this.documents.resume.content.type || 'file'})`;
      }
    } else {
      document.getElementById('resume-upload').querySelector('.upload-area').style.display = 'flex';
      document.getElementById('resume-info').style.display = 'none';
    }
  }

  renderSkills() {
    const skillsList = document.getElementById('skills-list');
    skillsList.innerHTML = '';

    this.skills.forEach((skill, index) => {
      const skillTag = document.createElement('div');
      skillTag.className = 'skill-tag';
      skillTag.innerHTML = `
        ${skill}
        <button class="remove-btn" onclick="popupManager.removeSkill(${index})">&times;</button>
      `;
      skillsList.appendChild(skillTag);
    });
  }

  renderExperience() {
    const experienceList = document.getElementById('experience-list');
    experienceList.innerHTML = '';

    this.experience.forEach((exp, index) => {
      const expItem = document.createElement('div');
      expItem.className = 'experience-item';
      expItem.innerHTML = `
        <h5>${exp.title}</h5>
        <p><strong>${exp.company}</strong> • ${exp.duration}</p>
        <p>${exp.description}</p>
        <button class="remove-btn" onclick="popupManager.removeExperience(${index})" style="margin-top: 8px; background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px;">Remove</button>
      `;
      experienceList.appendChild(expItem);
    });
  }

  renderEducation() {
    const educationList = document.getElementById('education-list');
    educationList.innerHTML = '';

    this.education.forEach((edu, index) => {
      const eduItem = document.createElement('div');
      eduItem.className = 'education-item';
      eduItem.innerHTML = `
        <h5>${edu.degree}</h5>
        <p><strong>${edu.school}</strong> • ${edu.year}</p>
        ${edu.gpa ? `<p>GPA: ${edu.gpa}</p>` : ''}
        <button class="remove-btn" onclick="popupManager.removeEducation(${index})" style="margin-top: 8px; background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px;">Remove</button>
      `;
      educationList.appendChild(eduItem);
    });
  }

  renderPreferences() {
    if (this.preferences.targetRoles) {
      document.getElementById('target-roles').value = this.preferences.targetRoles;
    }
    if (this.preferences.targetCompanies) {
      document.getElementById('target-companies').value = this.preferences.targetCompanies;
    }
    if (this.preferences.salaryRange) {
      document.getElementById('salary-min').value = this.preferences.salaryRange.min || '';
      document.getElementById('salary-max').value = this.preferences.salaryRange.max || '';
    }
    if (this.preferences.location) {
      document.getElementById('location').value = this.preferences.location;
    }
    if (this.preferences.remotePreference) {
      document.getElementById('remote-preference').value = this.preferences.remotePreference;
    }
  }

  async renderAnalysis() {
    // This would typically load analysis history from storage
    // For now, we'll show placeholder data
    const analysisHistory = document.getElementById('analysis-history');
    analysisHistory.innerHTML = '<p style="color: #6c757d; font-style: italic;">No job analysis history yet. Visit a job posting to get started!</p>';

    const tailoredResumes = document.getElementById('tailored-resumes');
    tailoredResumes.innerHTML = '<p style="color: #6c757d; font-style: italic;">No tailored resumes generated yet.</p>';
  }

  async handleFileUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    console.log('File upload started:', file.name, file.type, file.size);

    try {
      let content;
      
      // Handle different file types
      if (file.type === 'application/pdf') {
        // For PDFs, we'll store metadata and a placeholder
        content = {
          type: 'pdf',
          filename: file.name,
          size: file.size,
          lastModified: file.lastModified,
          placeholder: 'PDF content - would need PDF.js or similar library to extract text'
        };
      } else if (file.type.includes('text/') || file.type.includes('application/json')) {
        // For text files, read as text
        content = await this.readFileAsText(file);
      } else if (file.type.includes('application/vnd.openxmlformats-officedocument') || 
                 file.type.includes('application/msword')) {
        // For Word documents, store metadata
        content = {
          type: 'document',
          filename: file.name,
          size: file.size,
          lastModified: file.lastModified,
          placeholder: 'Word document - would need docx.js or similar library to extract text'
        };
      } else {
        // For other files, try to read as text or store metadata
        try {
          content = await this.readFileAsText(file);
        } catch (textError) {
          content = {
            type: 'unknown',
            filename: file.name,
            size: file.size,
            lastModified: file.lastModified,
            placeholder: 'File content could not be extracted as text'
          };
        }
      }
      
      console.log('File content processed:', typeof content, content);

      await chrome.runtime.sendMessage({
        action: 'saveDocument',
        data: {
          type: type,
          content: content,
          filename: file.name
        }
      });

      // Update local state
      this.documents[type] = {
        content: content,
        filename: file.name,
        lastUpdated: new Date().toISOString()
      };

      this.renderDocuments();
      this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`, 'success');
      
      // Clear the file input
      event.target.value = '';
      
    } catch (error) {
      console.error('File upload error:', error);
      this.showNotification(`Error uploading ${type}: ${error.message}`, 'error');
      // Clear the file input on error
      event.target.value = '';
    }
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('File read successfully:', e.target.result?.substring(0, 100) + '...');
        resolve(e.target.result);
      };
      reader.onerror = (e) => {
        console.error('FileReader error:', e);
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  }

  addSkill() {
    const input = document.getElementById('skill-input');
    const skill = input.value.trim();
    
    if (skill && !this.skills.includes(skill)) {
      this.skills.push(skill);
      this.saveSkills();
      this.renderSkills();
      input.value = '';
    }
  }

  removeSkill(index) {
    this.skills.splice(index, 1);
    this.saveSkills();
    this.renderSkills();
  }

  async saveSkills() {
    await chrome.runtime.sendMessage({
      action: 'saveDocument',
      data: {
        type: 'skills',
        content: this.skills,
        filename: 'skills.json'
      }
    });
  }

  openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
  }

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    // Clear form fields
    const modal = document.getElementById(modalId);
    modal.querySelectorAll('input, textarea').forEach(input => {
      input.value = '';
    });
  }

  async saveExperience() {
    const title = document.getElementById('exp-title').value.trim();
    const company = document.getElementById('exp-company').value.trim();
    const duration = document.getElementById('exp-duration').value.trim();
    const description = document.getElementById('exp-description').value.trim();

    if (title && company && duration && description) {
      const experience = { title, company, duration, description };
      this.experience.push(experience);
      
      await chrome.runtime.sendMessage({
        action: 'saveDocument',
        data: {
          type: 'experience',
          content: this.experience,
          filename: 'experience.json'
        }
      });

      this.renderExperience();
      this.closeModal('experience-modal');
      this.showNotification('Experience added successfully!', 'success');
    }
  }

  async removeExperience(index) {
    this.experience.splice(index, 1);
    await chrome.runtime.sendMessage({
      action: 'saveDocument',
      data: {
        type: 'experience',
        content: this.experience,
        filename: 'experience.json'
      }
    });
    this.renderExperience();
  }

  async saveEducation() {
    const degree = document.getElementById('edu-degree').value.trim();
    const school = document.getElementById('edu-school').value.trim();
    const year = document.getElementById('edu-year').value.trim();
    const gpa = document.getElementById('edu-gpa').value.trim();

    if (degree && school && year) {
      const education = { degree, school, year, gpa };
      this.education.push(education);
      
      await chrome.runtime.sendMessage({
        action: 'saveDocument',
        data: {
          type: 'education',
          content: this.education,
          filename: 'education.json'
        }
      });

      this.renderEducation();
      this.closeModal('education-modal');
      this.showNotification('Education added successfully!', 'success');
    }
  }

  async removeEducation(index) {
    this.education.splice(index, 1);
    await chrome.runtime.sendMessage({
      action: 'saveDocument',
      data: {
        type: 'education',
        content: this.education,
        filename: 'education.json'
      }
    });
    this.renderEducation();
  }

  async savePreferences() {
    const preferences = {
      targetRoles: document.getElementById('target-roles').value,
      targetCompanies: document.getElementById('target-companies').value,
      salaryRange: {
        min: parseInt(document.getElementById('salary-min').value) || 0,
        max: parseInt(document.getElementById('salary-max').value) || 0
      },
      location: document.getElementById('location').value,
      remotePreference: document.getElementById('remote-preference').value
    };

    await chrome.runtime.sendMessage({
      action: 'updatePreferences',
      data: preferences
    });

    this.preferences = preferences;
  }

  async exportData() {
    const data = {
      documents: this.documents,
      skills: this.skills,
      experience: this.experience,
      education: this.education,
      preferences: this.preferences,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-assistant-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showNotification('Data exported successfully!', 'success');
  }

  async importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const content = await this.readFileAsText(file);
        const data = JSON.parse(content);

        // Validate data structure
        if (data.documents || data.skills || data.experience || data.education || data.preferences) {
          // Import data
          if (data.documents) this.documents = { ...this.documents, ...data.documents };
          if (data.skills) this.skills = data.skills;
          if (data.experience) this.experience = data.experience;
          if (data.education) this.education = data.education;
          if (data.preferences) this.preferences = { ...this.preferences, ...data.preferences };

          // Save to storage
          await this.saveAllData();
          this.renderUI();
          this.showNotification('Data imported successfully!', 'success');
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error) {
        console.error('Import error:', error);
        this.showNotification('Error importing data. Please check the file format.', 'error');
      }
    };

    input.click();
  }

  async saveAllData() {
    // Save all data types
    const dataTypes = ['skills', 'experience', 'education'];
    for (const type of dataTypes) {
      await chrome.runtime.sendMessage({
        action: 'saveDocument',
        data: {
          type: type,
          content: this[type],
          filename: `${type}.json`
        }
      });
    }

    // Save preferences
    await chrome.runtime.sendMessage({
      action: 'updatePreferences',
      data: this.preferences
    });
  }

  async clearData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        await chrome.storage.local.clear();
        this.documents = {};
        this.skills = [];
        this.experience = [];
        this.education = [];
        this.preferences = {};
        
        this.renderUI();
        this.showNotification('All data cleared successfully!', 'success');
      } catch (error) {
        console.error('Clear data error:', error);
        this.showNotification('Error clearing data', 'error');
      }
    }
  }

  showHelp() {
    alert(`Job Application Assistant Help

📄 Documents Tab:
- Upload your resume and portfolio
- Add skills, work experience, and education
- All data is stored locally in your browser

📊 Analysis Tab:
- View job analysis history
- See tailored resumes
- Track your performance metrics

⚙️ Settings Tab:
- Set job preferences and target companies
- Configure salary range and location
- Manage your data (export/import/clear)

💡 Tips:
- Visit job postings on LinkedIn, Indeed, Glassdoor, etc.
- The extension will automatically analyze job requirements
- Generate tailored resumes for specific positions
- Track your application success rate`);
  }

  showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-size: 12px;
      font-weight: 500;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    if (type === 'success') {
      notification.style.background = '#28a745';
    } else {
      notification.style.background = '#dc3545';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  }

  savePortfolio() {
    const url = document.getElementById('portfolio-url').value.trim();
    
    if (!url) {
      this.showNotification('Please enter a portfolio URL', 'error');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      this.showNotification('Please enter a valid URL', 'error');
      return;
    }

    // Save to storage
    chrome.storage.local.set({ portfolio: { url, name: 'Portfolio Link' } }, () => {
      this.showNotification('Portfolio saved successfully!', 'success');
      this.renderPortfolio();
    });
  }

  editPortfolio() {
    // Show input form
    document.querySelector('.portfolio-input').style.display = 'flex';
    document.getElementById('portfolio-info').style.display = 'none';
    
    // Load current URL
    chrome.storage.local.get(['portfolio'], (result) => {
      if (result.portfolio) {
        document.getElementById('portfolio-url').value = result.portfolio.url;
      }
    });
  }

  renderPortfolio() {
    chrome.storage.local.get(['portfolio'], (result) => {
      const portfolio = result.portfolio;
      
      if (portfolio) {
        // Show portfolio info
        document.querySelector('.portfolio-input').style.display = 'none';
        document.getElementById('portfolio-info').style.display = 'flex';
        
        document.getElementById('portfolio-name').textContent = portfolio.name;
        document.getElementById('portfolio-url-display').textContent = portfolio.url;
      } else {
        // Show input form
        document.querySelector('.portfolio-input').style.display = 'flex';
        document.getElementById('portfolio-info').style.display = 'none';
      }
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.popupManager = new PopupManager();
}); 