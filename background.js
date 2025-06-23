// Background script for Job Application Assistant
class JobApplicationAssistant {
  constructor() {
    this.initializeStorage();
    this.setupMessageListeners();
  }

  async initializeStorage() {
    const defaults = {
      resume: null,
      portfolio: null,
      skills: [],
      experience: [],
      education: [],
      preferences: {},
      aiApiKey: null,
      history: []
    };
    await chrome.storage.local.set(defaults);
  }

  setupMessageListeners() {
    chrome.runtime.onConnect.addListener(port => {
      this.handleConnection(port);
    });
  }

  handleConnection(port) {
    port.onMessage.addListener(async (request) => {
      const { action, data, requestId } = request;
      let response;
      try {
        let responseData;
        switch (action) {
          case 'getData':
            responseData = await this.getData(data.key);
            break;
          case 'saveData':
            await this.saveData(data.key, data.value);
            responseData = { success: true };
            break;
          case 'getHistory':
            responseData = await this.getHistory();
            break;
          case 'analyzeJob':
            responseData = await this.analyzeJob(data.jobDetails);
            break;
          case 'generateTailoredResume':
            responseData = await this.generateTailoredResume(data.jobDetails);
            break;
          case 'generateCoverLetter':
            responseData = await this.generateCoverLetter(data.jobDetails);
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        response = { requestId, success: true, data: responseData };
      } catch (error) {
        console.error(`Error handling action ${action}:`, error);
        response = { requestId, success: false, error: error.message };
      }
      port.postMessage(response);
    });
  }

  async getData(key) {
    const result = await chrome.storage.local.get(key);
    return result[key];
  }

  async saveData(key, value) {
    await chrome.storage.local.set({ [key]: value });
    // Notify other parts of the extension if necessary
    const ports = chrome.runtime.connect({ name: "background-notification" });
    ports.postMessage({ action: 'storageChanged', key, value });
  }

  async getHistory() {
    const { history } = await chrome.storage.local.get('history');
    return history || [];
  }

  async saveToHistory(type, data) {
    const history = await this.getHistory();
    const newHistoryItem = {
      type: type,
      timestamp: new Date().toISOString(),
      ...data
    };
    await this.saveData('history', [newHistoryItem, ...history]);
  }
  
  async analyzeJob(jobDetails) {
    const { skills } = await chrome.storage.local.get('skills');
    const userSkills = skills || [];
    const jobText = jobDetails.description.toLowerCase();
    
    const matchedSkills = userSkills.filter(skill => jobText.includes(skill.toLowerCase()));
    const missingSkills = (jobDetails.requirements || []).filter(req => !userSkills.some(skill => req.toLowerCase().includes(skill.toLowerCase())));

    const analysis = { matchedSkills, missingSkills };
    await this.saveToHistory('jobAnalysis', { jobDetails, content: analysis });
    return { analysis };
  }

  async generateWithAI(prompt) {
    const { aiApiKey } = await chrome.storage.local.get('aiApiKey');
    if (!aiApiKey) return null;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API Error: ${errorData.error.message}`);
    }
    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  async generateTailoredResume(jobDetails) {
    const { resume, skills } = await chrome.storage.local.get(['resume', 'skills']);
    if (!resume || !resume.content) throw new Error("Resume not found.");
    
    const prompt = `Rewrite the following resume to be tailored for the job description provided. Output only the rewritten resume text.\n\nRESUME:\n${resume.content}\n\nSKILLS: ${skills.join(', ')}\n\nJOB:\n${jobDetails.title}\n${jobDetails.description}`;
    let tailoredResume = await this.generateWithAI(prompt);

    if (tailoredResume === null) {
      tailoredResume = `[Basic Tailored Resume for ${jobDetails.title}]\n\n(Add your OpenAI API key for a fully AI-powered resume.)\n\n${resume.content}`;
    }

    await this.saveToHistory('tailoredResume', { jobDetails, content: tailoredResume });
    return { resume: tailoredResume };
  }

  async generateCoverLetter(jobDetails) {
    const { resume } = await chrome.storage.local.get('resume');
    if (!resume || !resume.content) throw new Error("Resume not found.");

    const prompt = `Write a cover letter for the following job based on the user's resume. Output only the cover letter text.\n\nRESUME:\n${resume.content}\n\nJOB:\n${jobDetails.title} at ${jobDetails.company}\n${jobDetails.description}`;
    let coverLetter = await this.generateWithAI(prompt);

    if (coverLetter === null) {
      coverLetter = `[Basic Cover Letter for ${jobDetails.title}]\n\n(Add your OpenAI API key for a fully AI-powered cover letter.)`;
    }

    await this.saveToHistory('coverLetter', { jobDetails, content: coverLetter });
    return { coverLetter };
  }
}

new JobApplicationAssistant();

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

const ports = {};

async function getDocuments() {
  const storage = await chrome.storage.local.get();
  
  const getArrayContent = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    return [];
  };

  return {
    resume: storage.resume,
    portfolio: storage.portfolio,
    coverLetter: storage.coverLetter,
    skills: getArrayContent(storage.skills),
    experience: getArrayContent(storage.experience),
    education: getArrayContent(storage.education),
    analysisHistory: storage.analysisHistory || [],
    tailoredResumeHistory: storage.tailoredResumeHistory || [],
    coverLetterHistory: storage.coverLetterHistory || []
  };
}

async function generateWithAI(prompt, type) {
  try {
    const { apiKey } = await chrome.storage.local.get('apiKey');
    if (!apiKey) {
      console.log('OpenAI API key not found, using template fallback.');
      return null; // Indicates fallback
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2048,
        n: 1,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error.message}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error during ${type} generation with AI:`, error);
    // Return null to indicate that we should fall back to the template
    return null;
  }
}

async function generateTailoredResume(jobDetails) {
  const { resume, skills } = await getDocuments();
  const jobDescription = jobDetails.description || 'No description provided';
  const jobTitle = jobDetails.title || 'the position';

  const prompt = `
    Based on the following resume, user skills, and job description, please rewrite the resume to be perfectly tailored for the role.
    The output should be a complete resume in plain text format, ready to be copied and pasted.
    Ensure the tailored resume highlights the most relevant experiences and skills from the user's profile that match the job requirements.
    Incorporate keywords from the job description naturally.
    The tone should be professional and confident.

    --- USER'S RESUME ---
    ${resume}

    --- USER'S SKILLS ---
    ${skills.join(', ')}

    --- JOB DESCRIPTION ---
    **Job Title:** ${jobTitle}
    **Description:**
    ${jobDescription}
    ---

    Generate the tailored resume below:
  `;

  let tailoredResume = await generateWithAI(prompt, 'resume');

  if (tailoredResume === null) {
    // Fallback to simple template if AI generation fails or no API key
    const matchedSkills = skills.filter(skill =>
      new RegExp(`\\b${skill}\\b`, 'i').test(jobDescription)
    );

    tailoredResume = `
      [Your Name]
      [Your Contact Information]

      Objective: To obtain the ${jobTitle} position, leveraging my skills and experience.

      Summary: A dedicated professional with experience in various fields. Eager to apply my skills to a new challenge.

      Relevant Skills from Job Description:
      ${matchedSkills.length > 0 ? matchedSkills.map(s => `- ${s}`).join('\n') : '- No specific skills matched. Please review your skills list.'}

      Experience:
      ${resume}

      ---
      This is a basic resume tailored from your documents. For a more professional result, please add your OpenAI API key in the extension settings.
    `;
  }
  
  return tailoredResume.trim();
}

async function generateCoverLetter(jobDetails) {
  const { resume, skills } = await getDocuments();

  if (!resume) {
    throw new Error("Resume not found. Please upload it first.");
  }

  const jobDescription = jobDetails.description || 'No description provided';
  const jobTitle = jobDetails.title || 'the advertised position';
  const company = jobDetails.company || 'your company';

  const prompt = `
    Based on the following resume, user skills, and job description, please write a compelling and professional cover letter.
    The output should be a complete cover letter in plain text format.
    The letter should express genuine interest in the role and the company.
    It should highlight 2-3 key experiences or skills from the user's resume that are highly relevant to the job description.
    Do not just list skills; briefly explain how they apply to the role.
    The tone should be enthusiastic and professional. Address it to the "Hiring Manager".

    --- USER'S RESUME (for context) ---
    ${resume}

    --- USER'S SKILLS ---
    ${skills.join(', ')}

    --- JOB DESCRIPTION ---
    **Job Title:** ${jobTitle}
    **Company:** ${company}
    **Description:**
    ${jobDescription}
    ---

    Generate the cover letter below:
  `;

  let coverLetter = await generateWithAI(prompt, 'cover letter');

  if (coverLetter === null) {
    // Fallback to simple template
    coverLetter = `
      [Your Name]
      [Your Contact Information]
      [Date]

      Hiring Manager
      ${company}
      [Company Address]

      Dear Hiring Manager,

      I am writing to express my keen interest in the ${jobTitle} position I found on [Platform where you saw the ad]. With my background and skills, I am confident I would be a great fit for your team.

      My resume, which I have uploaded to the extension, details my experience. I am particularly skilled in: ${skills.slice(0, 3).join(', ')}.

      Thank you for your time and consideration. I look forward to hearing from you soon.

      Sincerely,
      [Your Name]

      ---
      This is a basic cover letter. For a more professional result, please add your OpenAI API key in the extension settings.
    `;
  }

  return coverLetter.trim();
}

chrome.runtime.onConnect.addListener((port) => {
  const portId = port.sender.tab ? `content-${port.sender.tab.id}` : 'popup';
  if (!ports[portId]) {
    ports[portId] = new JobApplicationAssistant();
  }
  ports[portId].handleConnection(port);
}); 