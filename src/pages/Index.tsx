import React from 'react';
import Layout from '@/components/layout/Layout';
import HeroSlider from '@/components/home/HeroSlider';
import FeaturedCollections from '@/components/home/FeaturedCollections';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import WhyChooseUs from '@/components/home/WhyChooseUs';

const Index: React.FC = () => {
  return (
    <Layout>
      <HeroSlider />
      <FeaturedCollections />
      <FeaturedProducts />
      <WhyChooseUs />
    </Layout>
  );
};

export default Index;
