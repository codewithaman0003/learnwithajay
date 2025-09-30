const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

function renderWithLayout(res, template, data = {}) {
    try {
        // Set default layout data
        const layoutData = {
            title: data.title || 'WebinarPro',
            baseUrl: data.baseUrl || process.env.BASE_URL || 'http://localhost:3000',
            includeRazorpay: data.includeRazorpay || false,
            includeCharts: data.includeCharts || false,
            includeAlpine: data.includeAlpine || false,
            ...data
        };

        // Read the template content
        const templatePath = path.join(__dirname, '../views/pages', template + '.ejs');
        let templateContent = fs.readFileSync(templatePath, 'utf8');
        
        // Render the template content first (in case it has variables)
        const renderedTemplate = ejs.render(templateContent, layoutData);
        
        // Read the layout content
        const layoutPath = path.join(__dirname, '../views/layouts/main.ejs');
        let layoutContent = fs.readFileSync(layoutPath, 'utf8');
        
        // Replace <%- body %> in layout with rendered template content
        const finalContent = layoutContent.replace('<%- body %>', renderedTemplate);
        
        // Send the final rendered content
        res.send(finalContent);
        
    } catch (error) {
        console.error('Layout rendering error:', error);
        res.status(500).send('Server error: ' + error.message);
    }
}

module.exports = { renderWithLayout };