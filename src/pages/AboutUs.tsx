import React from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

interface TeamMember {
  name: string;
  role: string;
  image: string;
}

const AboutUs: React.FC = () => {
  const teamMembers: TeamMember[] = [
    {
      name: 'Rishi Kethan Reddy',
      role: 'Software Developer',
      image: ''
    },
    {
      name: 'Om Aravindashan',
      role: 'API Designer',
      image: ''
    },
    {
      name: 'Chaithanya Kumar',
      role: 'Hardware Engineer',
      image: ''
    },
    {
      name: 'Kumara Gurubaran',
      role: 'ML Engineer',
      image: ''
    }
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Smart Irrigation System
      </h1>
      
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">About the Project</h2>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            The ROCK Smart Irrigation System is designed to help farmers optimize water usage through intelligent monitoring and automation. 
            By combining soil moisture sensors, weather data, and machine learning algorithms, our system provides precise irrigation 
            recommendations tailored to specific crops and soil conditions.
          </p>
          <p className="text-muted-foreground">
            Our mission is to promote sustainable farming practices by reducing water waste while improving crop yields. 
            The system continuously learns from environmental data and farmer feedback to enhance its recommendations over time.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Our Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="flex flex-col p-6 bg-muted/30 rounded-lg hover:bg-muted/40 transition-colors">
              <h3 className="font-semibold text-xl mb-2">{member.name}</h3>
              <p className="text-primary font-medium mb-3">{member.role}</p>
              <p className="text-muted-foreground text-sm">
                {member.name === 'Rishi Kethan Reddy' && 'Responsible for developing the web and mobile applications, implementing the user interface, and ensuring a seamless user experience.'}
                {member.name === 'Om Aravindashan' && 'Designs and implements the APIs that connect the frontend applications with the backend services and hardware components.'}
                {member.name === 'Chaithanya Kumar' && 'Designs and builds the physical components of the system, including sensors, controllers, and irrigation mechanisms.'}
                {member.name === 'Kumara Gurubaran' && 'Develops and trains the machine learning models that analyze soil, weather, and crop data to generate optimal irrigation recommendations.'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="text-primary" size={20} />
            <a 
              href="mailto:rishikethan.reddy2023@vitstudent.ac.in" 
              className="text-foreground hover:text-primary transition-colors hover:scale-105 transition-transform">
              Mail
            </a>
          </div>
          
          <div className="flex items-center gap-3">
            <Linkedin className="text-primary" size={20} />
            <a 
              href="https://www.linkedin.com/in/rishikethanreddy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors hover:scale-105 transition-transform">
              Connect on Linkedin
            </a>
          </div>
          
          <div className="flex items-center gap-3">
            <Github className="text-primary" size={20} />
            <a 
              href="https://github.com/Kumaragurubaran2005/Smart-Irigation-System" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors hover:scale-105 transition-transform">
              Github Repository
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;