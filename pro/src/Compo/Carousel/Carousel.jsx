import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import styles from './Carousel.module.css';

// Import your images
import cloudsImage from '../../assets/clouds.jpg';
import togetherWithUImage from '../../assets/TogetherWithU.jpg';
import witchNightImage from '../../assets/witch-night.jpg';

const Carousel = () => { // Renamed from FullscreenCarousel to Carousel for consistency
  const images = [cloudsImage, togetherWithUImage, witchNightImage];

  return (
    <div className={styles.carouselContainer}> {/* Changed class name for clarity */}
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation={{
          nextEl: `.${styles.swiperButtonNext}`, // Use module CSS class names
          prevEl: `.${styles.swiperButtonPrev}`, // Use module CSS class names
        }}
        pagination={{ clickable: true, dynamicBullets: true }} // dynamicBullets for a modern look
        autoplay={{
          delay: 5000,
          disableOnInteraction: false, // Continue autoplay even after user interaction
        }}
        loop={true}
        slidesPerView={1}
        className={styles.mySwiper}
      >
        {images.map((src, index) => (
          <SwiperSlide key={`slide-${index}`}>
            <img src={src} alt={`Slide ${index + 1}`} className={styles.slideImage} />
          </SwiperSlide>
        ))}

        {/* Custom Navigation Buttons inside Swiper component for easier styling and hover effects */}
        <div className={`${styles.swiperButtonPrev} swiper-button-prev`}></div>
        <div className={`${styles.swiperButtonNext} swiper-button-next`}></div>
      </Swiper>
    </div>
  );
};

export default Carousel; // Export the renamed component