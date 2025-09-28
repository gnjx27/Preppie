<h1>Preppie - Disaster Preparedness Mobile App</h1>
<h2>Overview</h2>
Preppie is a mobile app designed to help users prepare for and respond to emergencies and disasters. It provides comphrehensive resources, interactive quizzes, and personalized recommendations based on the user's location. The app aims to make disaster preparedness accessible, actionable, and engaging.
<br>
<br>
Key goals of Preppie:
<ul>
    <li>Provide offline-accessible guides for first aid and disaster response</li>
    <li>Offer checklists and quizzes to encourage preparedness</li>
    <li>Notify users in real-time about disasters affecting their area</li>
    <li>Reward engagement through a points and badge system</li>
    <li>Recommend content based on risk profiles and user location</li>
</ul>
<h2>Contents</h2>
<ul>
    <li><a href="#features">Features</a></li>
    <li><a href="#Technical Architecture">Technical Architecture</a></li>
    <li><a href="#Implementation Highlights">Implementation Highlights</a></li>
    <li><a href="#Demo Walkthrough">Demo Walkthrough</a></li>
</ul>
<h2 id="features">Features</h2>
<h3>Resource Hub</h3>
<ul>
    <li>First aid guides with step-by-step instructions</li>
    <li>Disaster guides for 21 disaster types</li>
    <li>Emergency contact numbers based on device location</li>
    <li>Offline-first approach using locally stored JSON data</li>
</ul>
<h3>Interactive Learning</h3>
<ul>
    <li>Quizzes for each disaster to reinforce learning</li>
    <li>First aid quizzes for general knowledge</li>
    <li>Points awarded for quiz completion (100% correct answers)</li>
</ul>
<h3>Checklists</h3>
<ul>
    <li>Recurring and one-time checklists to track preparedness</li>
    <li>Points awarded for checklist completion</li>
    <li>Monthly reset for recurring checklists using Firebase Cloud Functions</li>
</ul>
<h3>Notifications</h3>
<ul>
    <li>Real-time notifications for ongoing disasters in the user's location</li>
    <li>Push notifications integrated with Firebase Cloud Functions and Firestore</li>
    <li>Notifications include event title, affected countries, and a link to full reports</li>
</ul>
<h3>Gamification</h3>
<ul>
    <li>Points and badge system to reward engagement</li>
    <li>Badge progress displayed on home screen</li>
    <li>Confetti animations for quiz/checklist completion</li>
</ul>
<h3>Personalization & Recommendations</h3>
<ul>
    <li>Location-based recommendations (guides/quizzes) using ISO2-coded disaster risk profiles</li>
    <li>Quiz recommendations updated on completion</li>
</ul>
<h2 id="Technical Architecture">Technical Architecture</h2>
<h3>Frontend Stack</h3>
<ul>
    <li><b>React Native with Expo</b>: Cross-platform mobile development, enabling a single shared codebase for IOS and Android</li>
    <li><b>TypeScript</b>: Ensures type safety and maintainable code, reducing runtime errors and improving development efficiency</li>
    <li><b>NativeWind</b>: Consistent, responsive, and scalable UI design</li>
</ul>
<h3>Backend & Cloud Services</h3>
<ul>
    <li><b>Firebase Authentication</b>: Secure user management with email/password login</li>
    <li><b>Cloud Firestore</b>: Serverless NoSQL cloud database for synchronizing user progress, quiz/checklist data, badges, and disaster alerts</li>
    <li><b>Firebase Cloud Functions</b>: Serverless backend logic for automated tasks like polling disaster APIs, sending notifications, and managing recurring checklists</li>
    <li><b>Expo Notifications</b>: Cross-platform push notifications for delivering real-time emergency alerts and critical updates, even when the app is closed</li>
</ul>
<h3>External Integrations</h3>
<ul>
    <li><b>GDACS API</b>: Global Disaster Alert and Coordination System for real-time emergency data</li>
    <li><b>EMDAT Database</b>: Historical disaster data for risk profiling</li>
</ul>
<h2 id="Implementation Highlights">Implementation Highlights</h2>
<h3>1. Real-time Location-based Disaster Alerts</h3>
<ul>
    <li><b>Device location tracking</b>: Fetched user location and stored it in Firestore, updating automatically if the user travelled internationally</li>
    <li><b>Disaster alert integration</b>: Developed cloud functions to poll the GDACS API for global disaster alerts and extract affected countries</li>
    <li><b>Targeted notifications</b>: Matched user locations to active alerts and pushed notifications via Expo Notifications</li>
</ul>
<h3>2. Gamification: Points & Badge System</h3>
<ul>
    <li><b>Quizzes & checklists</b>: Created quizzes and checklists with progress tracking for interactive learning</li>
    <li><b>Points & badges</b>: Implemented a point-based system awarding points for quiz and checklist completions, with badges unlocking at milestones</li>
    <li><b>Recurring tasks</b>: Added monthly recurring checklist, with cloud function to reset recurring tasks at 12am UTC automatically</li>
    <li><b>Interactive UI</b>: Integrated confetti animations, popups for earned points, and progress bars to provide real-time feedback</li>
</ul>
<h3>3. Resource Hub for First Aid & Emergency Guides</h3>
<ul>
    <li><b>Curated content</b>: Collected guides from Red Cross (First Aid) and Ready.gov (Disaster Guides), compiling them into structured, mobile-friendly JSON</li>
    <li><b>Personalized recommendations</b>: Used user location and risk profiles (ISO2 country codes from EM-DAT data) to display relevant guides and quizzes on the homescreen</li>
    <li><b>Offline accessibility</b>: All guides are stored locally for instant access without internet connectivity</li>
    <li><b>UI consistency</b>: Styled screens with NativeWind for a clean, responsive design, with search functionality for easy navigation</li>
</ul>
<h2 id="Demo Walkthrough">Demo Walkthrough</h2>
<h3>Authentication</h3>
<table>
  <tr>
    <td align="center">
      <img src="assets/gifs/RegisterDemo_clean.gif" alt="Register Demo" width="300px" />
      <p>Register</p>
    </td>
    <td align="center">
      <img src="assets/gifs/LoginDemo_clean.gif" alt="Login Demo" width="300px" />
      <p>Login</p>
    </td>
  </tr>
</table>
<h3>Resource Hub</h3>
<table>
  <tr>
    <td align="center">
      <img src="assets/gifs/RecommendedDemo_clean.gif" alt="Recommended Guides & Quizzes Demo" width="300px" />
      <p>Recommended</p>
    </td>
    <td align="center">
      <img src="assets/gifs/LearnDemo_clean.gif" alt="Learn Tab Demo" width="300px" />
      <p>Learn Tab</p>
    </td>
  </tr>
</table>
<h3>Interactive Learning & Gamification</h3>
<table>
  <tr>
    <td align="center">
      <img src="assets/gifs/QuizChecklistDemo_clean.gif" alt="Quiz & Checklist Demo" width="300px" />
      <p>Quiz & Checklist Completion</p>
    </td>
    <td align="center">
      <img src="assets/gifs/BadgeDemo_clean.gif" alt="Badge Tab Demo" width="300px" />
      <p>Points & Badge Progress</p>
    </td>
  </tr>
</table>
<h3>Real-time Location Based Disaster Alerts</h3>
<table>
  <tr>
    <td align="center">
      <img src="assets/gifs/NotificationDemo_clean.gif" alt="Disaster Alert Demo" width="300px" />
      <p>Disaster Alert Notification</p>
    </td>
    <td align="center">
      <img src="assets/gifs/NotificationsDemo_clean.gif" alt="Notifications Demo" width="300px" />
      <p>Notifications & Disaster Report</p>
    </td>
  </tr>
</table>
<h3>Profile Management</h3>
<table>
  <tr>
    <td align="center">
      <img src="assets/gifs/ProfileLogoutDemo_clean.gif" alt="Profile Management Demo" width="300px" />
      <p>Profile Management</p>
    </td>
  </tr>
</table>