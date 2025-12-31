import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton: React.FC = () => {
  const phoneNumber = '923325124170';
  const message = encodeURIComponent('Hello! I have a question about Bushra\'s Collection.');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20BA5C] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-7 w-7" fill="currentColor" />
    </a>
  );
};

export default WhatsAppButton;