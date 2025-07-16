# Expense Tracking Frontend

A modern React TypeScript frontend for the Expense Tracking application, built with Vite, Tailwind CSS, and React Router.

## Features

- **Dashboard**: Overview with statistics and financial summary
- **Users Management**: Full CRUD operations for system users
- **Categories Management**: Manage expense categories with color coding
- **Expenses Management**: Track and manage expenses with user and category associations
- **Wishlist Management**: Manage wishlist items with priority levels
- **Budgets Management**: Set and track budgets by category and period
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **Real-time API Integration**: Direct communication with FastAPI backend

## Tech Stack

- **React 19** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API communication
- **Heroicons** - Beautiful SVG icons
- **Headless UI** - Accessible UI components

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API running on `http://localhost:8000`

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Users.tsx       # User management
│   ├── Categories.tsx  # Category management
│   ├── Expenses.tsx    # Expense management
│   ├── Wishlist.tsx    # Wishlist management
│   └── Budgets.tsx     # Budget management
├── services/           # API services
│   └── api.ts         # Axios configuration and API calls
├── types/             # TypeScript type definitions
│   └── api.ts         # API response types
├── App.tsx            # Main app component with routing
├── main.tsx           # App entry point
└── index.css          # Tailwind CSS imports
```

## API Integration

The frontend communicates with the FastAPI backend through the following endpoints:

- **Users**: `/users/`
- **Categories**: `/categories/`
- **Expenses**: `/expenses/`
- **Wishlist**: `/wishlist/`
- **Budgets**: `/budgets/`

All API calls are handled through the `services/api.ts` file with proper error handling and loading states.

## Features Overview

### Dashboard
- Real-time statistics from all modules
- Financial summary with expense tracking
- Quick action buttons
- System status indicators

### Users Management
- Create, read, update, and delete users
- Search functionality
- User avatar display
- Form validation

### Categories Management
- Color-coded categories
- Visual category picker
- Search and filter
- Category descriptions

### Expenses Management
- Track expenses by user and category
- Amount calculations and totals
- Date-based filtering
- Expense history

### Wishlist Management
- Priority-based wishlist items
- Estimated cost tracking
- User ownership
- Visual priority indicators

### Budgets Management
- Period-based budgets (weekly, monthly, quarterly, yearly)
- Category-specific budgets
- Active/inactive status
- Date range management

## Styling

The application uses Tailwind CSS for styling with custom components defined in `index.css`:

- `.btn-primary` - Primary action buttons
- `.btn-secondary` - Secondary action buttons
- `.btn-danger` - Delete/danger buttons
- `.input-field` - Form input styling
- `.card` - Card container styling

## Development

### Adding New Features

1. Create new component in `src/components/`
2. Add TypeScript types in `src/types/api.ts`
3. Add API methods in `src/services/api.ts`
4. Update routing in `src/App.tsx`
5. Add navigation link in the sidebar

### Code Style

- Use TypeScript for all components
- Follow React hooks best practices
- Use Tailwind CSS for styling
- Implement proper error handling
- Add loading states for async operations

## Deployment

1. Build the application:
```bash
npm run build
```

2. The built files will be in the `dist/` directory

3. Deploy the contents of `dist/` to your web server

## Troubleshooting

### Common Issues

1. **API Connection Errors**: Ensure the backend is running on `http://localhost:8000`
2. **CORS Issues**: Check backend CORS configuration
3. **Type Errors**: Run `npm run lint` to check for TypeScript issues
4. **Build Errors**: Clear `node_modules` and reinstall dependencies

### Development Tips

- Use the browser's developer tools to debug API calls
- Check the console for error messages
- Use React Developer Tools for component debugging
- Monitor network requests in the browser's Network tab

## Contributing

1. Follow the existing code style
2. Add proper TypeScript types
3. Include error handling
4. Test all CRUD operations
5. Ensure responsive design

## License

This project is part of the Expense Tracking application.
