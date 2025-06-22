# Job Application Assistant Chrome Extension

An AI-powered Chrome extension that helps job seekers analyze job requirements, track their applications, and generate tailored resumes for specific positions.

## Features

### 🤖 Smart Job Analysis
- **Automatic Job Detection**: Works on major job sites including LinkedIn, Indeed, Glassdoor, Monster, ZipRecruiter, and more
- **Skills Matching**: Analyzes job requirements and compares them with your skills
- **Match Percentage**: Provides a visual score showing how well you fit the position
- **Missing Skills Identification**: Highlights skills you need to develop

### 📄 Document Management
- **Resume Storage**: Upload and store your resume securely in the browser
- **Portfolio Management**: Keep your portfolio and other documents organized
- **Skills Database**: Maintain a comprehensive list of your technical and soft skills
- **Experience Tracking**: Store your work history and achievements
- **Education Records**: Keep track of your educational background

### 🎯 Tailored Resume Generation
- **AI-Powered Customization**: Generate resumes tailored to specific job requirements
- **Keyword Optimization**: Highlight relevant skills and experience for each position
- **Format Flexibility**: Support for multiple document formats (PDF, DOC, DOCX, TXT)

### 📊 Application Analytics
- **Performance Tracking**: Monitor your application success rates
- **Analysis History**: Keep track of all jobs you've analyzed
- **Insights Dashboard**: View metrics and trends in your job search

### ⚙️ Smart Preferences
- **Target Roles**: Set your preferred job titles and positions
- **Company Preferences**: Specify target companies you're interested in
- **Salary Range**: Define your expected compensation
- **Location Settings**: Set preferred work locations and remote preferences

## Installation

### Method 1: Load Unpacked Extension (Development)

1. **Download the Extension**
   ```bash
   git clone <repository-url>
   cd job-application-assistant
   ```

2. **Open Chrome Extensions**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the extension directory containing `manifest.json`

4. **Verify Installation**
   - The extension should appear in your extensions list
   - Click the extension icon in the toolbar to open the popup

### Method 2: Chrome Web Store (Coming Soon)
- Search for "Job Application Assistant" in the Chrome Web Store
- Click "Add to Chrome" to install

## Usage Guide

### Getting Started

1. **Set Up Your Profile**
   - Click the extension icon to open the popup
   - Go to the "Documents" tab
   - Upload your resume and portfolio
   - Add your skills, work experience, and education

2. **Configure Preferences**
   - Navigate to the "Settings" tab
   - Set your target roles, companies, and salary expectations
   - Configure location and remote work preferences

3. **Start Job Hunting**
   - Visit job postings on supported sites
   - The extension will automatically detect job pages
   - View the analysis panel that appears on the right side

### Using the Job Analysis

When you visit a job posting, the extension will:

1. **Extract Job Information**: Automatically pull job title, company, requirements, and description
2. **Analyze Requirements**: Compare job requirements with your skills and experience
3. **Display Results**: Show a match percentage and detailed analysis
4. **Provide Recommendations**: Suggest skills to develop and improvements

### Features Breakdown

#### 📄 Documents Tab
- **Resume Upload**: Drag and drop or click to upload your resume
- **Portfolio Management**: Store and organize your portfolio documents
- **Skills Management**: Add, edit, and remove skills with a simple interface
- **Experience Tracking**: Add detailed work experience entries
- **Education Records**: Maintain your educational background

#### 📊 Analysis Tab
- **Recent Analysis**: View history of jobs you've analyzed
- **Tailored Resumes**: Access resumes generated for specific positions
- **Performance Metrics**: Track your application success rates
- **Insights Dashboard**: View average match rates and application statistics

#### ⚙️ Settings Tab
- **Job Preferences**: Set target roles, companies, and salary expectations
- **Location Settings**: Configure preferred work locations
- **Remote Preferences**: Set remote work preferences
- **Data Management**: Export, import, or clear your data
- **AI Settings**: Configure optional OpenAI API key for enhanced features

## Supported Job Sites

The extension works on the following platforms:
- ✅ LinkedIn Jobs
- ✅ Indeed
- ✅ Glassdoor
- ✅ Monster
- ✅ ZipRecruiter
- ✅ CareerBuilder
- ✅ SimplyHired
- ✅ Dice
- ✅ AngelList
- ✅ Stack Overflow Jobs
- ✅ GitHub Careers

## Data Privacy & Security

- **Local Storage**: All data is stored locally in your browser
- **No Cloud Storage**: Your information never leaves your device
- **Privacy First**: No personal data is sent to external servers
- **Export Control**: You can export your data at any time
- **Easy Deletion**: Clear all data with one click

## Technical Requirements

- **Browser**: Google Chrome (version 88 or higher)
- **Permissions**: 
  - Storage access for saving documents and preferences
  - Active tab access for job site detection
  - Script injection for content analysis

## Troubleshooting

### Extension Not Working on Job Sites
1. Ensure the extension is enabled
2. Refresh the job posting page
3. Check if the site is in the supported list
4. Try disabling other extensions that might conflict

### Analysis Panel Not Appearing
1. Make sure you're on a job posting page
2. Wait for the page to fully load
3. Check the browser console for any errors
4. Try refreshing the page

### Data Not Saving
1. Check if you have sufficient storage space
2. Ensure the extension has storage permissions
3. Try clearing browser cache and cookies
4. Reinstall the extension if issues persist

## Development

### Project Structure
```
job-application-assistant/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── content.js            # Content script for job pages
├── content.css           # Styles for injected content
├── popup.html            # Extension popup interface
├── popup.css             # Popup styles
├── popup.js              # Popup functionality
├── icons/                # Extension icons
└── README.md             # This file
```

### Key Components

#### Background Script (`background.js`)
- Handles data storage and retrieval
- Manages communication between components
- Processes job analysis and resume generation
- Manages extension lifecycle

#### Content Script (`content.js`)
- Injects analysis panel into job pages
- Extracts job information from various sites
- Handles user interactions on job pages
- Communicates with background script

#### Popup Interface (`popup.html/js/css`)
- Document management interface
- Settings and preferences configuration
- Analysis history and insights
- Data import/export functionality

## Contributing

We welcome contributions! Please feel free to submit issues, feature requests, or pull requests.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Search existing issues on GitHub
3. Create a new issue with detailed information
4. Include browser version and extension version

## Changelog

### Version 1.0.0
- Initial release
- Basic job analysis functionality
- Document management system
- Skills matching and recommendations
- Tailored resume generation
- Multi-site support
- Local data storage
- Export/import functionality

---

**Happy Job Hunting! 🚀**

This extension is designed to make your job search more efficient and successful. By providing intelligent analysis and personalized recommendations, it helps you focus on opportunities that best match your skills and career goals. 