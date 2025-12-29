import React from 'react';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/home/Hero';
import FeaturedCollections from '@/components/home/FeaturedCollections';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import WhyChooseUs from '@/components/home/WhyChooseUs';

const Index: React.FC = () => {
  return (
    <Layout>
      <Hero />
      <FeaturedCollections />
      <FeaturedProducts />
      <WhyChooseUs />
    </Layout>
  );
};

export default Index;
