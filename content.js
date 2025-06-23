// Content script for Job Application Assistant
if (typeof JobPageAnalyzer === 'undefined') {
  class JobPageAnalyzer {
    constructor() {
      this.currentJobData = null;
      this.analysisPanel = null;
      this.currentAnalysis = null;
      this.port = null;
      this.pendingRequests = new Map();
      // this.init(); // REMOVE or comment out this line to prevent auto-injection
    }

    async init() {
      if (document.getElementById('job-assistant-panel')) return;

      this.setupConnection();
      // Wait for page to load
      await this.waitForPageLoad();
      
      // Extract job information
      this.currentJobData = this.extractJobInformation();
      
      // Create and inject analysis panel
      this.createAnalysisPanel();
      
      // Display pre-analysis view
      await this.displayPreAnalysisView();
      
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
            <div>
              <button id="job-assistant-toggle" class="job-assistant-toggle">−</button>
              <button id="job-assistant-close" class="job-assistant-close-btn">&times;</button>
            </div>
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

      // Load last panel position
      const lastPosition = JSON.parse(localStorage.getItem('job-assistant-panel-pos'));
      if (lastPosition) {
        this.analysisPanel.style.top = lastPosition.y;
        this.analysisPanel.style.left = lastPosition.x;
      }
    }

    setupConnection() {
      this.port = chrome.runtime.connect({ name: 'job-assistant' });

      this.port.onMessage.addListener(response => {
        const callback = this.pendingRequests.get(response.requestId);
        if (callback) {
          callback(response);
          this.pendingRequests.delete(response.requestId);
        }
      });

      this.port.onDisconnect.addListener(() => {
        this.port = null;
        this.displayError('Connection to extension lost. Please refresh the page.');
        console.error('Extension port disconnected.');
      });
    }

    sendMessage(action, data) {
      return new Promise((resolve, reject) => {
        if (!this.port) {
          return reject(new Error('Extension not connected.'));
        }

        const requestId = Date.now() + Math.random();
        this.pendingRequests.set(requestId, resolve);
        
        this.port.postMessage({ action, data, requestId });
      });
    }

    async analyzeCurrentJob() {
      try {
        // Send job data to background script for analysis
        const response = await this.sendMessage('analyzeJob', this.currentJobData);

        if (response.success) {
          this.currentAnalysis = response.data;
          this.displayJobInsightsView(response.data);
        } else {
          this.displayError('Failed to analyze job requirements');
        }
      } catch (error) {
        console.error('Analysis error:', error);
        if (error.message.includes('Extension context invalidated')) {
          this.displayError('Extension has been updated. Please refresh the page to continue.');
        } else {
          this.displayError('Error analyzing job requirements');
        }
      }
    }

    async displayPreAnalysisView() {
      const content = document.getElementById('job-assistant-content');
      content.innerHTML = `<div class="loading">Loading profile...</div>`;

      try {
        // Fetch resume, skills, and experience in parallel using getData
        const [resumeRes, skillsRes, experienceRes] = await Promise.all([
          this.sendMessage('getData', { key: 'resume' }),
          this.sendMessage('getData', { key: 'skills' }),
          this.sendMessage('getData', { key: 'experience' })
        ]);
        if (resumeRes.success && skillsRes.success && experienceRes.success) {
          const resume = resumeRes.data;
          const skills = skillsRes.data || [];
          const experience = experienceRes.data || [];
          const scores = {
            resume: resume ? 100 : 0,
            skills: Math.min(100, (skills.length / 10) * 100),
            experience: Math.min(100, (experience.length / 3) * 100),
          };

          content.innerHTML = `
            <div class="pre-analysis-view">
              <h2>See what's missing & how you match</h2>
              <p>Get a real-time analysis of this job's requirements against your profile.</p>
              
              <div class="profile-completeness">
                <h3>Your Profile</h3>
                <div class="profile-items">
                  <div class="profile-item">
                    <div class="progress-circle" style="--progress: ${scores.resume}deg">
                      ${scores.resume}%
                    </div>
                    <span>Resume</span>
                  </div>
                  <div class="profile-item">
                    <div class="progress-circle" style="--progress: ${scores.skills}deg">
                      ${scores.skills}%
                    </div>
                    <span>Skills</span>
                  </div>
                  <div class="profile-item">
                    <div class="progress-circle" style="--progress: ${scores.experience}deg">
                      ${scores.experience}%
                    </div>
                    <span>Experience</span>
                  </div>
                </div>
              </div>

              <button id="analyze-job-btn">Analyze Job</button>
            </div>
          `;
        } else {
          this.displayError('Could not load your profile.');
        }
      } catch (error) {
        this.displayError('Could not connect to the extension.');
      }
    }

    displayJobInsightsView(analysis) {
      const existingInsights = document.querySelector('.job-insights-view');
      if (existingInsights) existingInsights.remove();

      const insightsHTML = `
        <div class="job-insights-view">
          <h3>Job Insights</h3>
          <div class="skills-match">
            <div class="matched-skills">
              <h4>✅ Matched Skills (${analysis.matchedSkills.length})</h4>
              <div class="skills-list">
                ${analysis.matchedSkills.map(skill => `<span class="skill-tag matched">${skill}</span>`).join('') || '<span>None</span>'}
              </div>
            </div>
            <div class="missing-skills">
              <h4>❌ Missing Skills (${analysis.missingSkills.length})</h4>
              <div class="skills-list">
                ${analysis.missingSkills.map(skill => `<span class="skill-tag missing">${skill}</span>`).join('') || '<span>None</span>'}
              </div>
            </div>
          </div>
          <div class="premium-actions" style="margin-top: 24px;">
            <button class="premium-action-btn" id="generate-resume-btn">
              <span class="icon">📄</span> Tailor Resume
            </button>
            <button class="premium-action-btn" id="create-cover-letter-btn">
              <span class="icon">✉️</span> Create Cover Letter
            </button>
          </div>
        </div>
      `;
      
      const preAnalysisView = document.querySelector('.pre-analysis-view');
      if (preAnalysisView) {
        preAnalysisView.insertAdjacentHTML('beforeend', insightsHTML);
        const analyzeBtn = document.getElementById('analyze-job-btn');
        if(analyzeBtn) analyzeBtn.style.display = 'none';
      } else {
        // Fallback if the pre-analysis view isn't there for some reason
        const content = document.getElementById('job-assistant-content');
        content.innerHTML = insightsHTML;
      }
    }

    getFitDescription(score) {
      if (score >= 80) {
        return {
          title: "You'd be a <strong>top applicant</strong>",
          subtitle: "Your profile matches the required qualifications exceptionally well."
        };
      }
      if (score >= 60) {
        return {
          title: "You're a <strong>strong</strong> candidate",
          subtitle: "Your profile is a good match for the required qualifications."
        };
      }
      if (score >= 40) {
        return {
          title: "You're a <strong>potential</strong> fit",
          subtitle: "Your profile has some overlap with the required qualifications."
        };
      }
      return {
        title: "This might be a <strong>reach</strong> for you",
        subtitle: "Your profile has some gaps with the required qualifications."
      };
    }

    displayAnalysis(analysis) {
      // This function is now deprecated in favor of displayJobInsightsView
      // and the pre-analysis view. It can be removed or kept for fallback.
      this.displayJobInsightsView(analysis);
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

    setupEventListeners() {
      // Toggle panel
      const toggleButton = document.getElementById('job-assistant-toggle');
      toggleButton.addEventListener('click', () => {
        const content = document.getElementById('job-assistant-content');
        if (content.style.display === 'none') {
          content.style.display = 'block';
          toggleButton.textContent = '−';
        } else {
          content.style.display = 'none';
          toggleButton.textContent = '+';
        }
      });
      
      // Close panel
      document.getElementById('job-assistant-close').addEventListener('click', () => {
        this.analysisPanel.style.display = 'none';
      });

      // Make panel draggable
      this.makeDraggable();

      // Generate tailored resume and other actions
      document.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.id === 'analyze-job-btn' || target.closest('#analyze-job-btn')) {
          const btn = document.getElementById('analyze-job-btn');
          btn.textContent = 'Analyzing...';
          btn.disabled = true;

          const jobDetails = this.extractJobDetails();
          console.log('Sending job details for analysis:', jobDetails);
          this.port.postMessage({ action: 'analyzeJob', data: { jobDetails } });
        } else if (target.id === 'generate-resume-btn' || target.closest('#generate-resume-btn')) {
          const btn = document.getElementById('generate-resume-btn');
          btn.innerHTML = '<span class="icon">⏳</span> Tailoring...';
          btn.disabled = true;
          const jobDetails = this.extractJobDetails();
          this.port.postMessage({ action: 'generateTailoredResume', data: { jobDetails } });
        } else if (target.id === 'create-cover-letter-btn' || target.closest('#create-cover-letter-btn')) {
          const btn = document.getElementById('create-cover-letter-btn');
          btn.innerHTML = '<span class="icon">⏳</span> Creating...';
          btn.disabled = true;
          const jobDetails = this.extractJobDetails();
          this.port.postMessage({ action: 'generateCoverLetter', data: { jobDetails } });
        }
      });
    }

    makeDraggable() {
      const header = this.analysisPanel.querySelector('.job-assistant-header');
      let isDragging = false;
      let offsetX, offsetY;

      const onMouseDown = (e) => {
        isDragging = true;
        offsetX = e.clientX - this.analysisPanel.getBoundingClientRect().left;
        offsetY = e.clientY - this.analysisPanel.getBoundingClientRect().top;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      const onMouseMove = (e) => {
        if (!isDragging) return;
        this.analysisPanel.style.left = e.clientX - offsetX + 'px';
        this.analysisPanel.style.top = e.clientY - offsetY + 'px';
      };
      
      const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        // Save position
        const pos = {
          x: this.analysisPanel.style.left,
          y: this.analysisPanel.style.top,
        };
        localStorage.setItem('job-assistant-panel-pos', JSON.stringify(pos));
      };

      header.addEventListener('mousedown', onMouseDown);
    }

    async generateTailoredResume() {
      this.showNotification('Generating tailored resume...', 'success');
      try {
        const response = await this.sendMessage('generateResume', this.currentJobData);

        if (response.success) {
          this.showResumePreviewModal(response.data);
        } else {
          this.showNotification(response.error || 'Failed to generate resume.', 'error');
        }
      } catch (error) {
        console.error('Resume generation error:', error);
        this.showNotification('Error generating resume.', 'error');
      }
    }

    showResumePreviewModal(resumeData) {
      // Remove existing modal if any
      const existingModal = document.getElementById('resume-preview-modal');
      if (existingModal) existingModal.remove();

      const modalHTML = `
        <div class="job-assistant-modal-overlay" id="resume-preview-modal">
          <div class="job-assistant-modal-content">
            <div class="job-assistant-modal-header">
              <h4>Tailored Resume Preview</h4>
            </div>
            <div class="job-assistant-modal-body">
              ${resumeData.text}
            </div>
            <div class="job-assistant-modal-footer">
              <button class="premium-action-btn" id="close-resume-modal-btn">Close</button>
              <button class="premium-action-btn" id="download-resume-btn">Download .txt</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);

      // Add event listeners
      document.getElementById('close-resume-modal-btn').addEventListener('click', () => {
        document.getElementById('resume-preview-modal').remove();
      });

      document.getElementById('download-resume-btn').addEventListener('click', () => {
        this.downloadAsTxt(resumeData.text, `resume_${resumeData.for.replace(/\s+/g, '_')}.txt`);
      });
    }

    downloadAsTxt(content, filename) {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    async generateCoverLetter() {
      this.showNotification('Generating cover letter...', 'success');
      try {
        const response = await this.sendMessage('generateCoverLetter', this.currentJobData);

        if (response.success) {
          this.showNotification('Cover letter generated and saved!', 'success');
        } else {
          this.showNotification('Failed to generate cover letter.', 'error');
        }
      } catch (error) {
        console.error('Cover letter generation error:', error);
        this.showNotification('Error generating cover letter.', 'error');
      }
    }

    async saveJobAnalysis() {
      if (!this.currentAnalysis) {
        this.showNotification('No analysis to save.', 'error');
        return;
      }
      try {
        await this.sendMessage('saveDocument', {
          type: 'jobAnalysis',
          content: {
            jobData: this.currentJobData,
            analysis: this.currentAnalysis,
            savedAt: new Date().toISOString()
          },
          filename: `analysis_${this.currentJobData.title.replace(/\s+/g, '_')}_${Date.now()}.json`
        });

        this.showNotification('Job analysis saved successfully!', 'success');
      } catch (error) {
        console.error('Save error:', error);
        if (error.message.includes('Extension context invalidated')) {
          this.showNotification('Extension has been updated. Please refresh the page to continue.', 'error');
        } else {
          this.showNotification('Error saving job analysis', 'error');
        }
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

    showPreviewModal(title, contentText) {
      // Remove existing modal first
      const existingModal = document.getElementById('ja-preview-modal');
      if (existingModal) existingModal.remove();
  
      const modalHTML = `
          <div id="ja-preview-modal">
              <div class="modal-content">
                  <div class="modal-header">
                      <h2>${title}</h2>
                      <button id="ja-modal-close">&times;</button>
                  </div>
                  <div class="modal-body">
                      <textarea readonly>${contentText}</textarea>
                  </div>
                  <div class="modal-footer">
                      <button id="ja-modal-download">Download .txt</button>
                  </div>
              </div>
          </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
  
      document.getElementById('ja-modal-close').addEventListener('click', () => {
          document.getElementById('ja-preview-modal').remove();
      });
  
      document.getElementById('ja-modal-download').addEventListener('click', () => {
          const blob = new Blob([contentText], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const safeTitle = title.replace(/\s+/g, '_').toLowerCase();
          a.href = url;
          a.download = `${safeTitle}_${new Date().toISOString().split('T')[0]}.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      });
  
      // Close on escape key
      const closeOnEsc = (e) => {
          if (e.key === 'Escape') {
              const modal = document.getElementById('ja-preview-modal');
              if (modal) modal.remove();
              document.removeEventListener('keydown', closeOnEsc);
          }
      };
      document.addEventListener('keydown', closeOnEsc);
    }
  }
  // window.JobPageAnalyzer = JobPageAnalyzer; // Optionally expose for manual triggering
}

// Optionally, listen for a message to trigger the modal manually
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showJobAssistant') {
    if (typeof JobPageAnalyzer !== 'undefined') {
      const analyzer = new JobPageAnalyzer();
      analyzer.init();
      sendResponse({ success: true });
    }
  }
}); 