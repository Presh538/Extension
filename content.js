// Content script for Job Application Assistant
class JobPageAnalyzer {
  constructor() {
    this.currentJobData = null;
    this.analysisPanel = null;
    this.init();
  }

  async init() {
    // Wait for page to load
    await this.waitForPageLoad();
    
    // Extract job information
    this.currentJobData = this.extractJobInformation();
    
    // Create and inject analysis panel
    this.createAnalysisPanel();
    
    // Analyze the job
    await this.analyzeCurrentJob();
    
    // Set up event listeners
    this.setupEventListeners();
  }

  async waitForPageLoad() {
    return new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });
  }

  extractJobInformation() {
    const url = window.location.href;
    let jobData = {
      title: '',
      company: '',
      location: '',
      description: '',
      requirements: '',
      salary: '',
      postedDate: '',
      applicationUrl: url
    };

    // LinkedIn Jobs
    if (url.includes('linkedin.com/jobs')) {
      jobData = this.extractLinkedInJobData();
    }
    // Indeed
    else if (url.includes('indeed.com')) {
      jobData = this.extractIndeedJobData();
    }
    // Glassdoor
    else if (url.includes('glassdoor.com')) {
      jobData = this.extractGlassdoorJobData();
    }
    // Monster
    else if (url.includes('monster.com')) {
      jobData = this.extractMonsterJobData();
    }
    // ZipRecruiter
    else if (url.includes('ziprecruiter.com')) {
      jobData = this.extractZipRecruiterJobData();
    }
    // Generic extraction for other sites
    else {
      jobData = this.extractGenericJobData();
    }

    return jobData;
  }

  extractLinkedInJobData() {
    const title = this.getTextContent('.job-details-jobs-unified-top-card__job-title') ||
                 this.getTextContent('h1') ||
                 this.getTextContent('[data-test-id="job-details-jobs-unified-top-card__job-title"]');
    
    const company = this.getTextContent('.job-details-jobs-unified-top-card__company-name') ||
                   this.getTextContent('[data-test-id="job-details-jobs-unified-top-card__company-name"]');
    
    const location = this.getTextContent('.job-details-jobs-unified-top-card__bullet') ||
                    this.getTextContent('[data-test-id="job-details-jobs-unified-top-card__bullet"]');
    
    const description = this.getTextContent('.job-details-jobs-unified-top-card__job-description') ||
                       this.getTextContent('.jobs-description__content') ||
                       this.getTextContent('[data-test-id="job-details-jobs-unified-top-card__job-description"]');

    return { title, company, location, description, requirements: description };
  }

  extractIndeedJobData() {
    const title = this.getTextContent('.jobsearch-JobInfoHeader-title') ||
                 this.getTextContent('h1');
    
    const company = this.getTextContent('[data-testid="jobsearch-JobInfoHeader-companyName"]') ||
                   this.getTextContent('.jobsearch-JobInfoHeader-companyName');
    
    const location = this.getTextContent('.jobsearch-JobInfoHeader-companyLocation') ||
                    this.getTextContent('[data-testid="jobsearch-JobInfoHeader-companyLocation"]');
    
    const description = this.getTextContent('#jobDescriptionText') ||
                       this.getTextContent('.jobsearch-jobDescriptionText');

    return { title, company, location, description, requirements: description };
  }

  extractGlassdoorJobData() {
    const title = this.getTextContent('.job-title') ||
                 this.getTextContent('h1');
    
    const company = this.getTextContent('.employer-name') ||
                   this.getTextContent('.company-name');
    
    const location = this.getTextContent('.location') ||
                    this.getTextContent('.job-location');
    
    const description = this.getTextContent('.jobDescriptionContent') ||
                       this.getTextContent('.desc');

    return { title, company, location, description, requirements: description };
  }

  extractMonsterJobData() {
    const title = this.getTextContent('.job-title') ||
                 this.getTextContent('h1');
    
    const company = this.getTextContent('.company-name') ||
                   this.getTextContent('.employer-name');
    
    const location = this.getTextContent('.job-location') ||
                    this.getTextContent('.location');
    
    const description = this.getTextContent('.job-description') ||
                       this.getTextContent('.description');

    return { title, company, location, description, requirements: description };
  }

  extractZipRecruiterJobData() {
    const title = this.getTextContent('.job_title') ||
                 this.getTextContent('h1');
    
    const company = this.getTextContent('.company_name') ||
                   this.getTextContent('.employer-name');
    
    const location = this.getTextContent('.job_location') ||
                    this.getTextContent('.location');
    
    const description = this.getTextContent('.job_description') ||
                       this.getTextContent('.description');

    return { title, company, location, description, requirements: description };
  }

  extractGenericJobData() {
    const title = this.getTextContent('h1') ||
                 this.getTextContent('.job-title') ||
                 this.getTextContent('[class*="title"]');
    
    const company = this.getTextContent('[class*="company"]') ||
                   this.getTextContent('[class*="employer"]');
    
    const location = this.getTextContent('[class*="location"]') ||
                    this.getTextContent('[class*="place"]');
    
    const description = this.getTextContent('[class*="description"]') ||
                       this.getTextContent('[class*="details"]') ||
                       this.getTextContent('main');

    return { title, company, location, description, requirements: description };
  }

  getTextContent(selector) {
    const element = document.querySelector(selector);
    return element ? element.textContent.trim() : '';
  }

  createAnalysisPanel() {
    // Remove existing panel if any
    const existingPanel = document.getElementById('job-assistant-panel');
    if (existingPanel) {
      existingPanel.remove();
    }

    // Create panel HTML
    const panelHTML = `
      <div id="job-assistant-panel" class="job-assistant-panel">
        <div class="job-assistant-header">
          <h3>🤖 Job Application Assistant</h3>
          <button id="job-assistant-toggle" class="job-assistant-toggle">−</button>
        </div>
        <div id="job-assistant-content" class="job-assistant-content">
          <div class="loading">Analyzing job requirements...</div>
        </div>
      </div>
    `;

    // Insert panel into page
    const body = document.body;
    body.insertAdjacentHTML('beforeend', panelHTML);

    // Get panel reference
    this.analysisPanel = document.getElementById('job-assistant-panel');
  }

  async analyzeCurrentJob() {
    try {
      // Send job data to background script for analysis
      const response = await chrome.runtime.sendMessage({
        action: 'analyzeJob',
        data: this.currentJobData
      });

      if (response.success) {
        this.displayAnalysis(response.data);
      } else {
        this.displayError('Failed to analyze job requirements');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      this.displayError('Error analyzing job requirements');
    }
  }

  displayAnalysis(analysis) {
    const content = document.getElementById('job-assistant-content');
    
    const analysisHTML = `
      <div class="analysis-section">
        <div class="match-score">
          <div class="score-circle ${this.getScoreClass(analysis.overallFit)}">
            <span class="score-number">${analysis.overallFit}%</span>
            <span class="score-label">Match</span>
          </div>
        </div>
        
        <div class="job-info">
          <h4>${this.currentJobData.title}</h4>
          <p><strong>Company:</strong> ${this.currentJobData.company}</p>
          <p><strong>Location:</strong> ${this.currentJobData.location}</p>
        </div>
      </div>

      <div class="skills-section">
        <h4>Skills Analysis</h4>
        <div class="skills-match">
          <div class="matched-skills">
            <h5>✅ Matched Skills (${analysis.matchedSkills.length})</h5>
            <div class="skills-list">
              ${analysis.matchedSkills.map(skill => `<span class="skill-tag matched">${skill}</span>`).join('')}
            </div>
          </div>
          
          <div class="missing-skills">
            <h5>❌ Missing Skills (${analysis.missingSkills.length})</h5>
            <div class="skills-list">
              ${analysis.missingSkills.map(skill => `<span class="skill-tag missing">${skill}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="recommendations-section">
        <h4>Recommendations</h4>
        <div class="recommendations-list">
          ${analysis.recommendations.map(rec => `
            <div class="recommendation ${rec.priority}">
              <h5>${rec.title}</h5>
              <p>${rec.description}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="actions-section">
        <button id="generate-resume-btn" class="action-btn primary">Generate Tailored Resume</button>
        <button id="save-job-btn" class="action-btn secondary">Save Job Analysis</button>
      </div>
    `;

    content.innerHTML = analysisHTML;
  }

  displayError(message) {
    const content = document.getElementById('job-assistant-content');
    content.innerHTML = `
      <div class="error-message">
        <p>❌ ${message}</p>
        <button id="retry-analysis-btn" class="action-btn">Retry Analysis</button>
      </div>
    `;
  }

  getScoreClass(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  setupEventListeners() {
    // Toggle panel
    document.getElementById('job-assistant-toggle').addEventListener('click', () => {
      const content = document.getElementById('job-assistant-content');
      const toggle = document.getElementById('job-assistant-toggle');
      
      if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '−';
      } else {
        content.style.display = 'none';
        toggle.textContent = '+';
      }
    });

    // Generate tailored resume
    document.addEventListener('click', async (e) => {
      if (e.target.id === 'generate-resume-btn') {
        await this.generateTailoredResume();
      }
      
      if (e.target.id === 'save-job-btn') {
        await this.saveJobAnalysis();
      }
      
      if (e.target.id === 'retry-analysis-btn') {
        await this.analyzeCurrentJob();
      }
    });
  }

  async generateTailoredResume() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'generateResume',
        data: this.currentJobData
      });

      if (response.success) {
        this.showNotification('Tailored resume generated successfully!', 'success');
      } else {
        this.showNotification('Failed to generate resume', 'error');
      }
    } catch (error) {
      console.error('Resume generation error:', error);
      this.showNotification('Error generating resume', 'error');
    }
  }

  async saveJobAnalysis() {
    try {
      const analysis = await chrome.runtime.sendMessage({
        action: 'analyzeJob',
        data: this.currentJobData
      });

      if (analysis.success) {
        // Save to storage
        await chrome.runtime.sendMessage({
          action: 'saveDocument',
          data: {
            type: 'jobAnalysis',
            content: {
              jobData: this.currentJobData,
              analysis: analysis.data,
              savedAt: new Date().toISOString()
            },
            filename: `analysis_${this.currentJobData.title.replace(/\s+/g, '_')}_${Date.now()}.json`
          }
        });

        this.showNotification('Job analysis saved successfully!', 'success');
      }
    } catch (error) {
      console.error('Save error:', error);
      this.showNotification('Error saving job analysis', 'error');
    }
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `job-assistant-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize the analyzer when the script loads
const analyzer = new JobPageAnalyzer(); 