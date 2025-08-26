# Bus Tracking System

A React-based bus tracking system that allows students to log in and view their bus information.

## Features

- Student authentication using email and password
- Student data stored in JSON format
- Responsive login interface
- Student dashboard showing personal and bus information

## Project Structure

```
bus/
├── public/
│   ├── student.json          # Student data with credentials
│   └── vite.svg
├── src/
│   ├── Login.jsx             # Main login component
│   ├── main.jsx              # Application entry point
│   └── index.css
├── index.html                # HTML template
└── README.md
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ShivangSharma3/bus_tracking_system.git
cd bus_tracking_system
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Enter student credentials to log in:
   - Email: Use any email from the student.json file (e.g., amit@example.com)
   - Password: Use the corresponding password (e.g., password1)
3. After successful login, view student and bus information
4. Click "Logout" to return to the login screen

## Student Data Format

The student data is stored in `public/student.json` with the following structure:

```json
{
  "name": "Student Name",
  "rollNo": "Student Roll Number",
  "email": "student@example.com",
  "password": "password",
  "bus": { "$oid": "bus_id" }
}
```

## Available Students

The system includes 10 pre-configured students:
- Amit Sharma (amit@example.com / password1)
- Priya Singh (priya@example.com / password2)
- Ravi Kumar (ravi@example.com / password3)
- Neha Verma (neha@example.com / password4)
- Arjun Patel (arjun@example.com / password5)
- Simran Kaur (simran@example.com / password6)
- Rahul Yadav (rahul@example.com / password7)
- Anjali Gupta (anjali@example.com / password8)
- Manish Rawat (manish@example.com / password9)
- Pooja Mishra (pooja@example.com / password10)

## Technologies Used

- React 18
- Vite
- JavaScript (ES6+)
- HTML5
- CSS3

## Development

To run the project in development mode:

```bash
npm run dev
```

To build for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

For any questions or issues, please contact:
- GitHub: [@ShivangSharma3](https://github.com/ShivangSharma3)
