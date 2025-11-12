# Firebase Analytics CSV Dashboard

A dashboard tool for analyzing and visualizing CSV data exported from Firebase Analytics.

[한국어 버전 (Korean)](README.ko.md)

## Features

- **CSV-based Data Analysis**: Direct analysis of CSV files exported from Firebase Analytics
- **Interactive Dashboard**: Real-time charts and tables for data visualization
- **Screen View Analysis**: Screen-by-screen view counts and engagement analysis
- **User Engagement Analysis**: User engagement pattern analysis
- **Feature Usage Analysis**: Comprehensive analysis of all feature usage patterns
- **Report Download**: Download reports in CSV and HTML formats
- **Multi-project Support**: Manage CSV data from multiple projects by folder

## Getting Started

### Installation

```bash
npm install
```

### Data Preparation

1. Export CSV files from Firebase Analytics
2. Copy CSV files to `data/{project-name}/` folder

Required files:
- `Firebase_overview.csv` (or `Firebase_overview1.csv`, etc.)
- `Events_Event_name.csv` (or `Events_Event_name1.csv`, etc.)
- `Pages_and_screens_Page_title_and_screen_class.csv` (or `Pages_and_screens_Page_title_and_screen_class1.csv`, etc.)

### Running

```bash
npm run dev
```

Open `http://localhost:3000` in your browser

## Usage

### 1. Adding Data

```bash
# Create folder for each project
mkdir -p data/my-project

# Copy CSV files
cp /path/to/csv/*.csv data/my-project/
```

### 2. Using the Dashboard

- Select a project from the "Data Source" dropdown at the top
- Data for the selected project will be loaded automatically
- Generate CSV/HTML reports using the download buttons

## Project Structure

```
├── data/                    # CSV data folders
│   ├── default/            # Default project
│   └── {project-name}/     # Other projects
├── src/
│   ├── app/                # Next.js app routes
│   ├── components/         # React components
│   ├── repositories/       # Data repositories
│   └── services/           # Business logic
└── README.md
```

## Analysis Features

### Screen View Analysis
- Screen-by-screen view count analysis
- Average views per user
- Average engagement time

### User Engagement Analysis
- Screen-by-screen engagement analysis
- Engagement event counts
- User engagement patterns

### Feature Usage Analysis
- Comprehensive analysis of all features
- Feature type classification (screen, menu, action, event)
- Related screen mapping

## Reports

### CSV Report
- Download all analysis data in CSV format
- Can be opened in Excel for further analysis

### HTML Report
- Visually organized report
- Includes charts
- Printable format

## Tech Stack

- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Recharts**: Chart library
- **Chart.js**: Charts for HTML reports
- **csv-parse**: CSV parsing
- **date-fns**: Date handling

## License

MIT
