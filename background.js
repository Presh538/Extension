// Background script for Job Application Assistant
class JobApplicationAssistant {
  constructor() {
    this.initializeStorage();
    this.setupMessageListeners();
  }

  async initializeStorage() {
    const defaultData = {
      resume: null,
      portfolio: null,
      coverLetter: null,
      skills: [],
      experience: [],
      education: [],
      preferences: {
        targetRoles: [],
        targetCompanies: [],
        salaryRange: { min: 0, max: 0 },
        location: '',
        remotePreference: 'any'
      },
      aiApiKey: '',
      analysisHistory: []
    };

    // Initialize storage with default values if not exists
    const result = await chrome.storage.local.get();
    const updatedData = { ...defaultData, ...result };
    await chrome.storage.local.set(updatedData);
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'saveDocument':
          await this.saveDocument(request.data);
          sendResponse({ success: true });
          break;

        case 'getDocuments':
          const documents = await this.getDocuments();
          sendResponse({ success: true, data: documents });
          break;

        case 'analyzeJob':
          const analysis = await this.analyzeJobRequirements(request.data);
          sendResponse({ success: true, data: analysis });
          break;

        case 'generateResume':
          const newResume = await this.generateTailoredResume(request.data);
          sendResponse({ success: true, data: newResume });
          break;

        case 'extractJobInfo':
          const jobInfo = await this.extractJobInformation(request.data);
          sendResponse({ success: true, data: jobInfo });
          break;

        case 'updatePreferences':
          await this.updatePreferences(request.data);
          sendResponse({ success: true });
          break;

        case 'getPreferences':
          const preferences = await this.getPreferences();
          sendResponse({ success: true, data: preferences });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async saveDocument(data) {
    const { type, content, filename } = data;
    console.log('Saving document:', { type, filename, contentType: typeof content });
    
    try {
      const storage = await chrome.storage.local.get();
      
      storage[type] = {
        content,
        filename,
        lastUpdated: new Date().toISOString()
      };

      await chrome.storage.local.set(storage);
      console.log('Document saved successfully:', type);
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  }

  async getDocuments() {
    const storage = await chrome.storage.local.get();
    return {
      resume: storage.resume,
      portfolio: storage.portfolio,
      coverLetter: storage.coverLetter,
      skills: storage.skills || [],
      experience: storage.experience || [],
      education: storage.education || []
    };
  }

  async analyzeJobRequirements(jobData) {
    const { title, description, requirements, company } = jobData;
    const documents = await this.getDocuments();
    
    // Extract skills and requirements from job posting
    const jobSkills = this.extractSkillsFromText(description + ' ' + requirements);
    const userSkills = documents.skills.map(skill => skill.toLowerCase());
    
    // Calculate match percentage
    const matchedSkills = jobSkills.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.includes(skill) || skill.includes(userSkill)
      )
    );
    
    const matchPercentage = (matchedSkills.length / jobSkills.length) * 100;
    
    // Identify missing skills
    const missingSkills = jobSkills.filter(skill => 
      !userSkills.some(userSkill => 
        userSkill.includes(skill) || skill.includes(userSkill)
      )
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(missingSkills, documents);

    return {
      matchPercentage: Math.round(matchPercentage),
      matchedSkills,
      missingSkills,
      recommendations,
      overallFit: this.calculateOverallFit(matchPercentage, documents, jobData)
    };
  }

  extractSkillsFromText(text) {
    // Common technical skills and keywords
    const skillKeywords = [
      'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js',
      'sql', 'mongodb', 'aws', 'docker', 'kubernetes', 'git', 'agile',
      'scrum', 'machine learning', 'ai', 'data analysis', 'project management',
      'leadership', 'communication', 'teamwork', 'problem solving',
      'html', 'css', 'typescript', 'php', 'ruby', 'go', 'rust', 'c++',
      'devops', 'ci/cd', 'microservices', 'api', 'rest', 'graphql'
    ];

    const words = text.toLowerCase().split(/\s+/);
    const foundSkills = new Set();

    skillKeywords.forEach(skill => {
      if (text.toLowerCase().includes(skill)) {
        foundSkills.add(skill);
      }
    });

    return Array.from(foundSkills);
  }

  generateRecommendations(missingSkills, documents) {
    const recommendations = [];

    if (missingSkills.length > 0) {
      recommendations.push({
        type: 'skill_gap',
        title: 'Skills to Develop',
        description: `Consider learning: ${missingSkills.slice(0, 5).join(', ')}`,
        priority: 'high'
      });
    }

    if (documents.experience.length < 2) {
      recommendations.push({
        type: 'experience',
        title: 'Gain More Experience',
        description: 'Consider taking on freelance projects or contributing to open source',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  calculateOverallFit(matchPercentage, documents, jobData) {
    let score = matchPercentage;

    // Bonus for relevant experience
    const relevantExperience = documents.experience.filter(exp => 
      exp.title.toLowerCase().includes(jobData.title.toLowerCase()) ||
      exp.company.toLowerCase().includes(jobData.company.toLowerCase())
    );
    
    if (relevantExperience.length > 0) {
      score += 20;
    }

    // Bonus for education level
    if (documents.education.some(edu => edu.degree.toLowerCase().includes('master') || edu.degree.toLowerCase().includes('phd'))) {
      score += 10;
    }

    return Math.min(100, Math.round(score));
  }

  async generateTailoredResume(jobData) {
    const documents = await this.getDocuments();
    const analysis = await this.analyzeJobRequirements(jobData);
    
    // Create a tailored version of the resume
    const tailoredResume = {
      ...documents.resume,
      tailoredFor: jobData.title,
      company: jobData.company,
      matchPercentage: analysis.matchPercentage,
      highlightedSkills: analysis.matchedSkills,
      recommendations: analysis.recommendations
    };

    // Store the tailored version
    await this.saveDocument({
      type: 'tailoredResume',
      content: tailoredResume,
      filename: `resume_${jobData.title.replace(/\s+/g, '_')}_${Date.now()}.json`
    });

    return tailoredResume;
  }

  async extractJobInformation(pageData) {
    // Extract job information from the page
    const jobInfo = {
      title: pageData.title || '',
      company: pageData.company || '',
      location: pageData.location || '',
      description: pageData.description || '',
      requirements: pageData.requirements || '',
      salary: pageData.salary || '',
      postedDate: pageData.postedDate || '',
      applicationUrl: pageData.applicationUrl || ''
    };

    return jobInfo;
  }

  async updatePreferences(preferences) {
    const storage = await chrome.storage.local.get();
    storage.preferences = { ...storage.preferences, ...preferences };
    await chrome.storage.local.set(storage);
  }

  async getPreferences() {
    const storage = await chrome.storage.local.get();
    return storage.preferences || {};
  }
}

// Initialize the assistant when the extension loads
const assistant = new JobApplicationAssistant();

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Job Application Assistant installed');
});

// Handle tab updates to inject content scripts when needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const jobSites = [
      'linkedin.com/jobs',
      'indeed.com/viewjob',
      'glassdoor.com/Job',
      'monster.com/job',
      'ziprecruiter.com/c',
      'careerbuilder.com/job',
      'simplyhired.com/job',
      'dice.com/job-detail',
      'angel.co/jobs',
      'stackoverflow.com/jobs',
      'github.com/careers'
    ];

    const isJobSite = jobSites.some(site => tab.url.includes(site));
    
    if (isJobSite) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
    }
  }
}); 