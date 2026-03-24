import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cutopt-pro-web.vercel.app' // Verilen gerçek domain ile güncellenmeli
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    // Diğer sayfalarınız varsa buraya ekleyebilirsiniz
  ]
}
