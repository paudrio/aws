import React, { useState } from "react";
import { Link } from "wouter";
import { Mail, Phone, MapPin, Send, Facebook, MessageCircle, CheckCircle, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.44a8.27 8.27 0 0 0 4.83 1.56V6.69h-1.07z" />
    </svg>
  );
}

type QA = { q: string; a: string };
type ModalContent = { title: string; subtitle?: string; items: QA[] };

const MODAL_CONTENT: Record<string, ModalContent> = {
  quienes: {
    title: "¿Quiénes Somos?",
    subtitle: "Conoce más sobre PAUDRONIX GT",
    items: [
      { q: "¿Qué es PAUDRONIX GT?", a: "PAUDRONIX GT es una plataforma guatemalteca especializada en servicios digitales: streaming, películas, juegos, recarga de saldo y mucho más. Operamos 100% en línea para todo Guatemala." },
      { q: "¿Cuánto tiempo llevan operando?", a: "Llevamos años en el mercado digital guatemalteco, ofreciendo productos y servicios de alta calidad con atención personalizada a través de WhatsApp." },
      { q: "¿Son una empresa confiable?", a: "Sí. Somos una empresa guatemalteca con miles de clientes satisfechos. Puedes verificar nuestras reseñas y testimonios en nuestras redes sociales." },
      { q: "¿En qué zonas de Guatemala operan?", a: "Operamos en toda la República de Guatemala. Nuestros servicios son digitales, por lo que puedes comprar desde cualquier lugar del país con conexión a internet." },
      { q: "¿Cómo puedo contactarlos?", a: "Puedes contactarnos vía WhatsApp al +502 3787 1216, por correo electrónico a paudronixgt@gmail.com, o a través de nuestras redes sociales en Facebook y TikTok." },
      { q: "¿Tienen tienda física?", a: "Somos una plataforma 100% digital. No contamos con tienda física, lo que nos permite ofrecer precios más accesibles y atención inmediata en línea." },
      { q: "¿Cuál es su misión?", a: "Nuestra misión es brindar a los guatemaltecos acceso fácil, rápido y económico a los mejores servicios y productos digitales del mercado." },
      { q: "¿Cuál es su visión?", a: "Ser la plataforma digital número 1 de Guatemala, reconocida por su confiabilidad, variedad de productos y excelente servicio al cliente." },
      { q: "¿Qué los diferencia de la competencia?", a: "Nos diferencia la atención personalizada vía WhatsApp, precios accesibles en quetzales, entrega inmediata y soporte técnico incluido en cada compra." },
      { q: "¿Trabajan con distribuidores?", a: "Sí, contamos con una red de distribuidores y revendedores en Guatemala. Si te interesa distribuir nuestros productos, contáctanos para más información." },
      { q: "¿Tienen presencia en redes sociales?", a: "Sí, estamos en Facebook (@PAUDRONIXGT), TikTok (@paudronix) y WhatsApp (+502 3787 1216). Síguenos para enterarte de ofertas exclusivas." },
      { q: "¿Cómo garantizan la calidad de sus servicios?", a: "Revisamos y probamos cada producto antes de ofrecerlo. Además, contamos con soporte post-venta para resolver cualquier problema que pueda surgir." },
      { q: "¿Atienden en días festivos?", a: "Nuestro soporte por WhatsApp está disponible los 7 días de la semana, incluyendo días festivos, aunque los tiempos de respuesta pueden variar." },
      { q: "¿Ofrecen facturas o comprobantes?", a: "Emitimos comprobantes digitales de cada transacción. Para facturación formal, contáctanos indicando tus datos fiscales." },
      { q: "¿Cómo manejo una queja o sugerencia?", a: "Escríbenos por WhatsApp o al correo paudronixgt@gmail.com. Tomamos muy en serio cada comentario para mejorar continuamente nuestro servicio." },
    ],
  },
  comprar: {
    title: "¿Cómo Comprar?",
    subtitle: "Guía paso a paso para realizar tu compra",
    items: [
      { q: "¿Cómo realizo mi primera compra?", a: "1) Elige el producto que deseas. 2) Haz clic en 'Comprar'. 3) Completa el formulario de pago. 4) Envía tu comprobante de pago por WhatsApp. 5) Recibe tu producto digitalmente en minutos." },
      { q: "¿Qué métodos de pago aceptan?", a: "Aceptamos transferencias bancarias (Banrural, BAC, BI), Binance (USDT), y pagos verificados por WhatsApp. Todos los métodos están disponibles al momento de hacer tu pedido." },
      { q: "¿Cuánto tiempo tarda en llegar mi pedido?", a: "La mayoría de productos digitales se entregan en 5 a 30 minutos después de confirmar el pago. En casos especiales puede tardar hasta 1 hora hábil." },
      { q: "¿Puedo comprar si estoy fuera de Guatemala?", a: "Sí, nuestros servicios digitales están disponibles para cualquier persona. Sin embargo, el precio está en Quetzales (Q) guatemaltecos." },
      { q: "¿Necesito crear una cuenta para comprar?", a: "No es obligatorio, pero recomendamos registrarte para tener historial de compras, acceso más rápido y ofertas exclusivas para miembros." },
      { q: "¿Es seguro comprar en PAUDRONIX GT?", a: "Totalmente. Usamos métodos de pago verificados y nuestro equipo revisa cada transacción manualmente para garantizar la seguridad de tu compra." },
      { q: "¿Qué hago si tengo un problema con mi pedido?", a: "Contáctanos de inmediato por WhatsApp al +502 3787 1216. Nuestro equipo de soporte está disponible para ayudarte a resolver cualquier inconveniente." },
      { q: "¿Puedo hacer un pedido por WhatsApp directamente?", a: "Sí, puedes escribirnos al +502 3787 1216 y uno de nuestros asesores te guiará en el proceso de compra de forma personalizada." },
      { q: "¿Puedo comprar múltiples productos a la vez?", a: "Sí, usa el carrito de compras para agregar varios productos y realizar un solo pago. Esto agiliza el proceso y puede darte acceso a descuentos por volumen." },
      { q: "¿Cómo envío el comprobante de pago?", a: "Toma una captura de pantalla de tu transferencia o depósito y envíala por WhatsApp al +502 3787 1216 junto con tu nombre y el producto que compraste." },
      { q: "¿Qué pasa si hago una transferencia equivocada?", a: "Contáctanos de inmediato por WhatsApp. En la mayoría de casos podemos resolver el problema o redirigir el pago hacia el producto correcto." },
      { q: "¿Ofrecen precios especiales por compras frecuentes?", a: "Sí, tenemos programa de clientes frecuentes. Al comprar regularmente, acumulas beneficios y accedes a precios preferenciales automáticamente." },
      { q: "¿Cómo funciona el proceso de entrega digital?", a: "Una vez confirmado tu pago, recibes las credenciales, claves de activación o acceso al servicio directamente por WhatsApp o al correo que registraste." },
      { q: "¿Puedo cancelar una compra antes de recibirla?", a: "Si el pedido aún no ha sido procesado, sí es posible cancelar. Contáctanos de inmediato por WhatsApp para gestionar la cancelación y reembolso." },
      { q: "¿Tienen catálogo actualizado de precios?", a: "Nuestro catálogo en línea se actualiza constantemente. Si no encuentras el precio de algún producto, pregúntanos por WhatsApp y te informamos al instante." },
    ],
  },
  faq: {
    title: "Preguntas Frecuentes",
    subtitle: "Respuestas a las dudas más comunes",
    items: [
      { q: "¿Los productos son originales y legales?", a: "Sí, todos nuestros productos y servicios son originales y adquiridos mediante canales oficiales o distribuidores autorizados." },
      { q: "¿Puedo compartir mi cuenta de streaming?", a: "Depende del plan adquirido. Algunos planes permiten múltiples perfiles o pantallas simultáneas. Te indicamos exactamente qué incluye cada plan al comprarlo." },
      { q: "¿Qué pasa si mi servicio deja de funcionar?", a: "Te brindamos soporte técnico gratuito. Si el problema es de nuestro lado, lo solucionamos o te ofrecemos un reemplazo sin costo adicional." },
      { q: "¿Cuánto tiempo duran los servicios de streaming?", a: "Los planes varían: mensual (30 días), trimestral (90 días) o anual (365 días). La duración está claramente indicada en cada producto." },
      { q: "¿Puedo renovar mi servicio antes de que expire?", a: "Sí, puedes renovar en cualquier momento. Al renovar antes del vencimiento, los días restantes se suman al nuevo período." },
      { q: "¿Tienen garantía sus productos?", a: "Sí. Ofrecemos garantía en todos nuestros servicios. Si el producto no funciona correctamente en las primeras 24-48 horas, te damos una solución o reembolso." },
      { q: "¿Puedo cancelar mi suscripción?", a: "Los servicios digitales no son cancelables una vez entregados. Sin embargo, puedes simplemente no renovar al vencimiento." },
      { q: "¿Hacen descuentos por compras al por mayor?", a: "Sí. Si deseas comprar varios servicios o eres revendedor, contáctanos para negociar precios especiales por volumen." },
      { q: "¿Puedo usar los servicios en varios dispositivos?", a: "Depende del plan. Algunos servicios permiten uso en múltiples dispositivos simultáneamente. Consulta las especificaciones de cada producto antes de comprar." },
      { q: "¿Qué dispositivos son compatibles?", a: "La mayoría de nuestros servicios funcionan en Smart TV, celular (Android e iOS), tableta, computadora y Fire Stick. Verificamos compatibilidad antes de la entrega." },
      { q: "¿Cómo activo mi servicio una vez recibido?", a: "Te enviamos instrucciones claras paso a paso junto con tus credenciales. Si tienes alguna duda, nuestro equipo te guía por WhatsApp en tiempo real." },
      { q: "¿Qué idiomas están disponibles en los servicios?", a: "La mayoría de nuestros servicios de streaming incluyen contenido en español e inglés. Algunos títulos también están disponibles en otros idiomas." },
      { q: "¿Ofrecen prueba gratis?", a: "Ocasionalmente realizamos promociones con períodos de prueba. Síguenos en redes sociales para enterarte de estas ofertas especiales." },
      { q: "¿Qué velocidad de internet necesito?", a: "Para streaming en HD se recomienda al menos 10 Mbps. Para 4K necesitas 25 Mbps o más. La mayoría de conexiones de internet en Guatemala son suficientes." },
      { q: "¿Los precios incluyen IVA?", a: "Los precios mostrados en la plataforma son el precio final que pagas. No hay cobros ocultos ni cargos adicionales sorpresa en ninguna compra." },
    ],
  },
  devoluciones: {
    title: "Política de Devoluciones",
    subtitle: "Conoce nuestros términos de devolución y reembolso",
    items: [
      { q: "¿Aceptan devoluciones?", a: "Por la naturaleza digital de nuestros productos, las devoluciones se evalúan caso por caso. Si el producto no funciona según lo prometido, buscamos una solución inmediata." },
      { q: "¿Cuándo aplica un reembolso?", a: "Aplica reembolso cuando: el producto no fue entregado, el servicio no funciona desde el inicio y no podemos solucionarlo, o hubo un error en el cobro." },
      { q: "¿Cómo solicito una devolución?", a: "Contacta a nuestro soporte por WhatsApp (+502 3787 1216) dentro de las primeras 24 horas de tu compra, indicando el motivo y tu comprobante de pago." },
      { q: "¿En cuánto tiempo procesan el reembolso?", a: "Una vez aprobado, el reembolso se procesa en 1 a 3 días hábiles, dependiendo del método de pago original." },
      { q: "¿Qué situaciones NO aplican para reembolso?", a: "No aplica reembolso si el servicio funciona correctamente, el problema es causado por el dispositivo del cliente, o han pasado más de 48 horas sin reportar el problema." },
      { q: "¿Ofrecen cambios en lugar de reembolso?", a: "Sí. En muchos casos ofrecemos cambio por otro producto de igual valor como alternativa al reembolso, lo que agiliza el proceso." },
      { q: "¿Qué documentos necesito para solicitar devolución?", a: "Necesitas tu comprobante de pago (captura de la transferencia), el número de orden o referencia y una descripción del problema que experimentaste." },
      { q: "¿Puedo devolver un producto si simplemente no me gustó?", a: "Al ser productos digitales entregados de forma instantánea, no aplicamos devoluciones por cambio de parecer. Sí lo hacemos cuando el producto tiene fallas." },
      { q: "¿Qué pasa si recibí el producto equivocado?", a: "Nos disculpamos por el inconveniente. Si recibiste un producto diferente al que pediste, te enviamos el correcto sin costo adicional de manera inmediata." },
      { q: "¿Cubren fallas técnicas del servicio?", a: "Sí. Las fallas técnicas de nuestro lado están cubiertas. Te brindamos soporte gratuito o un reemplazo del servicio durante el período de garantía." },
      { q: "¿La garantía es válida si comparto mi cuenta?", a: "La garantía aplica siempre y cuando el servicio se use según los términos acordados. Compartir credenciales puede invalidar la garantía en ciertos planes." },
      { q: "¿Pueden hacer excepciones a la política de devolución?", a: "Evaluamos cada caso de manera individual. Si tienes una situación especial, explícanosla por WhatsApp y buscamos la mejor solución para ti." },
      { q: "¿Cómo evitar problemas con mi compra?", a: "Lee bien las especificaciones del producto, verifica compatibilidad con tu dispositivo y sigue las instrucciones de activación. Nuestro equipo siempre está disponible para orientarte." },
      { q: "¿Qué garantía tienen los juegos digitales?", a: "Los juegos tienen garantía de activación. Si la clave no funciona o ya fue usada, te proporcionamos una nueva sin costo." },
      { q: "¿Cuál es el plazo máximo para reclamar garantía?", a: "El plazo estándar de garantía es de 48 horas desde la entrega del servicio. Para planes mensuales o anuales, la garantía aplica durante todo el período contratado." },
    ],
  },
  vender: {
    title: "Vende con Nosotros",
    subtitle: "Conviértete en vendedor en PAUDRONIX GT",
    items: [
      { q: "¿Cómo puedo vender en PAUDRONIX GT?", a: "Regístrate en nuestra plataforma, completa el proceso de verificación como vendedor y comienza a publicar tus productos digitales para llegar a miles de clientes." },
      { q: "¿Qué tipo de productos puedo vender?", a: "Servicios de streaming, juegos digitales, saldos, IPTV, software y cualquier producto digital legal. Revisamos cada publicación para garantizar calidad." },
      { q: "¿Cuánto cobra PAUDRONIX GT de comisión?", a: "Nuestra comisión es competitiva y varía según la categoría del producto. Te informamos exactamente los términos al momento de tu registro como vendedor." },
      { q: "¿Cuándo recibo mis pagos?", a: "Los pagos a vendedores se procesan semanalmente (cada lunes) o mensualmente, según prefieras. Transferimos directamente a tu banco o Binance." },
      { q: "¿Necesito ser empresa para vender?", a: "No. Tanto personas individuales como empresas pueden vender en nuestra plataforma. Solo necesitas ser mayor de 18 años y tener productos legales." },
      { q: "¿Cómo contacto al equipo de vendedores?", a: "Escríbenos a paudronixgt@gmail.com con el asunto 'Quiero ser vendedor' o contáctanos por WhatsApp al +502 3787 1216." },
      { q: "¿Qué soporte recibo como vendedor?", a: "Tenemos un equipo dedicado para vendedores que te ayuda con la configuración, publicación de productos, resolución de disputas y optimización de ventas." },
      { q: "¿Puedo fijar mis propios precios?", a: "Sí, tú defines el precio de venta de tus productos dentro de los rangos permitidos por categoría. Nosotros aplicamos la comisión establecida automáticamente." },
      { q: "¿Cuántos productos puedo publicar?", a: "No hay límite de productos. Puedes publicar todos los productos que tengas disponibles. A mayor catálogo, mayor probabilidad de ventas." },
      { q: "¿Cómo se gestionan las quejas de clientes?", a: "Tenemos un sistema de mediación. Si un cliente reporta un problema con tu producto, te notificamos y tienes 24 horas para resolverlo antes de que intervengamos." },
      { q: "¿Puedo ver estadísticas de mis ventas?", a: "Sí, tienes acceso a un panel de vendedor con estadísticas de ventas, ingresos, productos más vendidos y reseñas de clientes en tiempo real." },
      { q: "¿Hay requisitos mínimos de ventas?", a: "No exigimos mínimos de ventas. Sin embargo, los vendedores más activos reciben beneficios adicionales como destacados en el catálogo y soporte prioritario." },
      { q: "¿Cómo verifico mi identidad como vendedor?", a: "El proceso de verificación incluye proporcionar un documento de identificación válido (DPI o pasaporte) y datos de contacto verificables." },
      { q: "¿Puedo vender como revendedor de otros proveedores?", a: "Sí, puedes revender productos de proveedores mayoristas. Solo asegúrate de tener autorización para comercializarlos y que sean productos legítimos." },
      { q: "¿Qué pasa si tengo problemas con el inventario?", a: "Puedes actualizar tu inventario en tiempo real desde tu panel de vendedor. Si un producto se agota, puedes pausarlo temporalmente sin perder tu historial de ventas." },
    ],
  },
  anunciate: {
    title: "Anúnciate con Nosotros",
    subtitle: "Llega a miles de clientes en Guatemala",
    items: [
      { q: "¿Qué opciones de publicidad ofrecen?", a: "Banners en la página principal, menciones en redes sociales, publicaciones patrocinadas, espacios destacados en el catálogo y notificaciones a suscriptores." },
      { q: "¿Cuántas visitas tiene PAUDRONIX GT?", a: "Recibimos miles de visitas mensuales de guatemaltecos interesados en productos y servicios digitales, garantizando alta visibilidad para tu negocio." },
      { q: "¿Cuánto cuesta anunciarse?", a: "Los precios varían según tipo de anuncio, duración y posición. Contáctanos para un presupuesto personalizado según tus necesidades y presupuesto." },
      { q: "¿Qué tipo de negocios pueden anunciarse?", a: "Cualquier negocio legal puede anunciarse. Preferimos servicios digitales, tecnología, entretenimiento y productos afines a nuestra audiencia." },
      { q: "¿Cómo miden los resultados de mi anuncio?", a: "Proporcionamos reportes semanales de impresiones, clics y alcance de tu anuncio para que puedas medir el retorno de tu inversión." },
      { q: "¿Cuánto tiempo duran los anuncios?", a: "Los paquetes van desde 1 semana hasta 6 meses. A mayor duración, mayor descuento sobre el precio base del anuncio." },
      { q: "¿Puedo cambiar mi anuncio durante la campaña?", a: "Sí, puedes actualizar el diseño o texto de tu anuncio hasta 2 veces durante el período contratado sin costo adicional." },
      { q: "¿Diseñan el material publicitario?", a: "Ofrecemos servicio de diseño básico de banners incluido en paquetes selectos. También puedes enviarnos tu material ya diseñado según nuestras especificaciones técnicas." },
      { q: "¿Puedo segmentar a qué audiencia llega mi anuncio?", a: "Nuestra audiencia es principalmente guatemalteca interesada en tecnología y entretenimiento digital. Podemos destacar tu anuncio en secciones específicas según tu producto." },
      { q: "¿Hacen publicaciones en sus redes sociales?", a: "Sí, incluimos publicaciones en Facebook y TikTok como parte de paquetes premium. El alcance varía según la plataforma y el contenido." },
      { q: "¿Cuál es el proceso para comenzar a anunciarme?", a: "1) Contáctanos. 2) Definimos el paquete adecuado. 3) Recibes propuesta formal. 4) Apruebas el material. 5) Tu anuncio va en línea en 48 horas." },
      { q: "¿Aceptan pagos en quetzales para publicidad?", a: "Sí, aceptamos pago en quetzales por transferencia bancaria, así como en USDT por Binance para empresas internacionales." },
      { q: "¿Pueden anunciarse negocios fuera de Guatemala?", a: "Sí, nuestra plataforma tiene alcance en toda Guatemala y comunidades guatemaltecas en el exterior. Es ideal para negocios que quieran llegar a este mercado." },
      { q: "¿Ofrecen paquetes para startups o negocios pequeños?", a: "Tenemos paquetes accesibles diseñados para negocios pequeños con presupuesto limitado. Pregúntanos por nuestros planes de entrada." },
      { q: "¿Cómo inicio una campaña publicitaria?", a: "Escríbenos a paudronixgt@gmail.com con asunto 'Publicidad' o WhatsApp al +502 3787 1216. Te respondemos con propuesta en menos de 24 horas." },
    ],
  },
  alianzas: {
    title: "Alianzas Estratégicas",
    subtitle: "Crezcamos juntos como socios de negocio",
    items: [
      { q: "¿Qué tipo de alianzas buscan?", a: "Buscamos alianzas con distribuidores, revendedores, creadores de contenido, influencers y empresas tecnológicas que quieran crecer en el mercado digital guatemalteco." },
      { q: "¿Qué beneficios ofrece una alianza?", a: "Comisiones por referidos, acceso a productos a precios de distribuidor, soporte prioritario, co-marketing y visibilidad de tu marca ante nuestra audiencia." },
      { q: "¿Cómo funciona el programa de referidos?", a: "Recibes un código o enlace único. Cada venta generada a través tuyo te genera una comisión del porcentaje acordado, pagada semanalmente." },
      { q: "¿Pueden hacer alianzas con influencers?", a: "Sí, trabajamos con creadores de contenido guatemaltecos. Si tienes audiencia y quieres monetizarla, podemos hacer una colaboración rentable." },
      { q: "¿Cómo inicio una propuesta de alianza?", a: "Envíanos correo a paudronixgt@gmail.com con asunto 'Propuesta de Alianza' describiendo tu negocio o audiencia. Te respondemos en 48 horas hábiles." },
      { q: "¿Cuánto es la comisión por referidos?", a: "Las comisiones varían entre el 5% y el 20% según el tipo de producto y volumen de ventas generadas. Acordamos el porcentaje al inicio de la alianza." },
      { q: "¿Necesito experiencia previa para ser distribuidor?", a: "No es obligatorio tener experiencia previa. Te capacitamos sobre nuestros productos y te brindamos materiales de venta para que puedas comenzar de inmediato." },
      { q: "¿Puedo ser distribuidor exclusivo en mi zona?", a: "Evaluamos solicitudes de exclusividad territorial según el volumen de ventas comprometido y la zona geográfica. Contáctanos para analizar tu caso." },
      { q: "¿Ofrecen capacitación a sus distribuidores?", a: "Sí, proporcionamos capacitación en línea sobre todos nuestros productos, técnicas de ventas y atención al cliente para garantizar tu éxito." },
      { q: "¿Cómo se pagan las comisiones?", a: "Pagamos semanalmente por transferencia bancaria (Banrural, BAC, BI) o en USDT por Binance, según tu preferencia." },
      { q: "¿Existe un mínimo de ventas para mantener la alianza?", a: "Para alianzas básicas no hay mínimo. Para alianzas premium con beneficios exclusivos, acordamos metas de ventas mensuales razonables." },
      { q: "¿Puedo combinar la alianza con mi propio negocio?", a: "Absolutamente. Muchos de nuestros aliados complementan nuestra oferta con sus propios servicios, generando valor adicional para sus clientes." },
      { q: "¿Qué materiales de marketing proporcionan?", a: "Brindamos banners digitales, imágenes de productos, descripciones optimizadas y precios actualizados para facilitar tu labor de ventas." },
      { q: "¿Tienen programa de alianzas para ONG o instituciones?", a: "Sí, analizamos propuestas de instituciones sin fines de lucro con condiciones especiales. Creemos en el impacto social positivo de la tecnología." },
      { q: "¿Puedo terminar una alianza cuando quiera?", a: "Sí, las alianzas pueden terminar con un preaviso de 30 días. Liquidamos todas las comisiones pendientes antes del cierre de la relación comercial." },
    ],
  },
  politicas: {
    title: "Políticas y Términos",
    subtitle: "Condiciones de uso de PAUDRONIX GT",
    items: [
      { q: "¿Cuáles son los términos de uso de la plataforma?", a: "Al usar PAUDRONIX GT aceptas utilizar la plataforma únicamente para fines legales, no redistribuir los servicios sin autorización y respetar los derechos de propiedad intelectual de los productos adquiridos." },
      { q: "¿Quién puede usar la plataforma?", a: "La plataforma está disponible para personas mayores de 18 años o menores con supervisión de un adulto responsable. Al registrarte confirmas cumplir con este requisito." },
      { q: "¿Qué usos están prohibidos en la plataforma?", a: "Está prohibido: revender servicios sin autorización, compartir credenciales de cuentas personales, realizar fraudes o pagos con métodos no autorizados, publicar contenido ilegal o engañoso." },
      { q: "¿Está permitido compartir las credenciales de mis servicios?", a: "Depende del plan contratado. Algunos planes permiten perfiles adicionales o pantallas simultáneas. Compartir credenciales fuera de lo permitido puede cancelar tu servicio sin reembolso." },
      { q: "¿Qué pasa si violo los términos de uso?", a: "En caso de violación, podemos suspender o cancelar tu cuenta de forma inmediata, sin reembolso de servicios activos, y reportar actividades ilegales a las autoridades guatemaltecas correspondientes." },
      { q: "¿Pueden modificar los términos sin avisar?", a: "Nos reservamos el derecho de actualizar estos términos. Para cambios importantes, notificamos con al menos 7 días de anticipación por correo. El uso continuo implica aceptación." },
      { q: "¿Bajo qué ley opera PAUDRONIX GT?", a: "Operamos bajo las leyes de la República de Guatemala. Cualquier disputa legal se resolverá según la legislación guatemalteca vigente en los tribunales competentes." },
      { q: "¿Quién es responsable de los productos publicados?", a: "PAUDRONIX GT es responsable del contenido propio. Los vendedores externos son responsables de la veracidad de sus publicaciones. Moderamos activamente para garantizar calidad." },
      { q: "¿Están permitidas las compras para reventa?", a: "Las compras para reventa están permitidas únicamente bajo un acuerdo formal de distribuidor con PAUDRONIX GT. Sin ese acuerdo, la reventa no autorizada viola estos términos." },
      { q: "¿Cómo manejan la propiedad intelectual?", a: "Todo el contenido de PAUDRONIX GT — logos, textos, diseños e imágenes — es propiedad exclusiva de la empresa. Los productos de terceros respetan sus respectivas licencias y derechos de autor." },
      { q: "¿Qué responsabilidad tiene PAUDRONIX GT por fallas del servicio?", a: "Nos comprometemos a resolver fallas técnicas de nuestra responsabilidad. No somos responsables por interrupciones causadas por terceros (plataformas externas, cortes de luz o internet)." },
      { q: "¿Pueden cancelar un servicio activo?", a: "Podemos cancelar un servicio activo únicamente en caso de violación comprobada de estos términos. En ningún otro caso se cancela un servicio durante su período de vigencia." },
      { q: "¿Cómo reporto un uso indebido de la plataforma?", a: "Escríbenos a paudronixgt@gmail.com o por WhatsApp al +502 3787 1216. Investigamos cada reporte y tomamos acción en menos de 48 horas hábiles." },
      { q: "¿Los precios publicados son definitivos?", a: "Los precios pueden cambiar sin previo aviso. Sin embargo, una vez confirmado tu pedido y procesado el pago, el precio acordado no varía en ningún caso." },
      { q: "¿Tienen política de uso justo del servicio?", a: "Sí. Los servicios deben usarse de manera razonable y personal. El uso excesivo o automatizado que afecte la estabilidad del servicio puede resultar en suspensión de la cuenta." },
    ],
  },
  privacidad: {
    title: "Aviso de Privacidad",
    subtitle: "Cómo protegemos tu información personal",
    items: [
      { q: "¿Qué es el aviso de privacidad?", a: "Es el documento que describe cómo PAUDRONIX GT recopila, usa, almacena y protege tu información personal de acuerdo con las leyes de protección de datos de Guatemala." },
      { q: "¿Qué datos personales recopilan?", a: "Nombre completo, correo electrónico, número de teléfono/WhatsApp, datos de pago (solo los necesarios para procesar transacciones) y preferencias de compra." },
      { q: "¿Para qué usan mi información?", a: "Para procesar tus pedidos, enviarte confirmaciones de compra, brindarte soporte técnico, enviarte ofertas relevantes (con tu consentimiento) y mejorar nuestros servicios." },
      { q: "¿Guardan mis datos de pago?", a: "Solo almacenamos los datos mínimos necesarios para verificar pagos (referencia de transferencia). No guardamos números de cuenta bancaria completos ni contraseñas." },
      { q: "¿Por cuánto tiempo guardan mis datos?", a: "Guardamos tus datos mientras seas cliente activo y por hasta 5 años después para cumplir obligaciones legales. Puedes solicitar eliminación anticipada." },
      { q: "¿Comparten mis datos con otras empresas?", a: "No vendemos ni compartimos tus datos con terceros para fines comerciales. Solo los compartimos con proveedores de servicios esenciales (procesadores de pago) bajo acuerdo de confidencialidad." },
      { q: "¿Cómo protegen mi información de hackeos?", a: "Usamos conexiones cifradas (HTTPS), acceso restringido a datos internos, contraseñas encriptadas y monitoreo constante de seguridad en nuestros sistemas." },
      { q: "¿Puedo ver qué datos tienen de mí?", a: "Sí, tienes derecho de acceso a tus datos. Solicítalo por correo a paudronixgt@gmail.com y te respondemos en un plazo máximo de 15 días hábiles." },
      { q: "¿Puedo corregir mis datos si están incorrectos?", a: "Absolutamente. Si detectas información incorrecta en tu perfil, puedes actualizarla directamente o contactarnos para que lo hagamos nosotros." },
      { q: "¿Puedo oponerme al uso de mis datos para marketing?", a: "Sí, puedes darte de baja de comunicaciones de marketing en cualquier momento respondiendo 'BAJA' a cualquier correo nuestro o pidiéndolo por WhatsApp." },
      { q: "¿Usan mis datos para publicidad dirigida?", a: "Solo usamos tus datos de compra para enviarte ofertas de productos similares a los que ya compraste. No usamos tus datos en plataformas publicitarias externas." },
      { q: "¿Qué pasa con mis datos si cierro mi cuenta?", a: "Al cerrar tu cuenta, eliminamos o anonimizamos tus datos personales dentro de los 30 días siguientes, conservando solo lo requerido por obligaciones legales." },
      { q: "¿Cómo manejan los datos de menores?", a: "No recopilamos intencionalmente datos de menores de 18 años. Si detectamos una cuenta de menor, la suspendemos y eliminamos los datos asociados." },
      { q: "¿Tienen responsable de protección de datos?", a: "Sí, el responsable de datos de PAUDRONIX GT puede ser contactado en paudronixgt@gmail.com para cualquier consulta o solicitud relacionada con tu privacidad." },
      { q: "¿Cómo me notifican si hay una brecha de seguridad?", a: "En caso de una brecha de seguridad que afecte tus datos, te notificamos por correo electrónico en un plazo máximo de 72 horas desde que tengamos conocimiento del incidente." },
    ],
  },
};

function FAQItem({ qa, index }: { qa: QA; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="border-b border-indigo-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 px-1 text-left gap-3 group"
      >
        <span className="font-semibold text-gray-800 text-sm leading-snug group-hover:text-indigo-600 transition-colors">
          {qa.q}
        </span>
        <span
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
          style={{ background: open ? "#6366f1" : "#fff7ed" }}
        >
          {open
            ? <ChevronUp className="w-3.5 h-3.5 text-white" />
            : <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />}
        </span>
      </button>
      {open && (
        <div className="pb-4 px-1">
          <p className="text-sm text-gray-600 leading-relaxed">{qa.a}</p>
        </div>
      )}
    </div>
  );
}

function Modal({ id, onClose }: { id: string; onClose: () => void }) {
  const content = MODAL_CONTENT[id];
  if (!content) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#fffbf5" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0 px-6 py-5" style={{ background: "linear-gradient(135deg,#6366f1,#6366f1)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-white font-black text-xl leading-tight">{content.title}</h2>
              {content.subtitle && <p className="text-indigo-100 text-sm mt-0.5">{content.subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all mt-0.5"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {content.items.map((qa, i) => (
            <FAQItem key={i} qa={qa} index={i} />
          ))}
        </div>
        <div className="flex-shrink-0 px-6 py-4 border-t border-indigo-100 bg-indigo-50 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">¿Tienes más preguntas?</p>
          <a
            href="https://wa.me/50237871216?text=Hola%2C%20tengo%20una%20pregunta"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,#6366f1,#6366f1)" }}
          >
            <MessageCircle className="w-3.5 h-3.5" /> Contactar soporte
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openModal = (id: string) => setActiveModal(id);
  const closeModal = () => setActiveModal(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubscribeStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscribeStatus("success");
        setStatusMessage(data.message);
        setEmail("");
        setTimeout(() => setSubscribeStatus("idle"), 4000);
      } else {
        setSubscribeStatus("error");
        setStatusMessage(data.error || "Error");
        setTimeout(() => setSubscribeStatus("idle"), 3000);
      }
    } catch {
      setSubscribeStatus("error");
      setStatusMessage("Error de conexion");
      setTimeout(() => setSubscribeStatus("idle"), 3000);
    }
  };

  const lnk = "text-xs hover:text-indigo-400 transition-colors cursor-pointer bg-transparent border-none p-0 text-slate-400";

  return (
    <>
      {activeModal && <Modal id={activeModal} onClose={closeModal} />}

      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-10">

            <div>
              <h4 className="text-white font-display font-bold text-sm uppercase tracking-wider mb-4">Sobre Nosotros</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => openModal("quienes")} className={lnk}>Quienes somos</button></li>
                <li><a href="https://wa.me/50237871216?text=Hola%2C%20quiero%20contactarlos" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-indigo-400 transition-colors">Contactanos</a></li>
                <li><button onClick={() => openModal("politicas")} className={lnk}>Politicas y Terminos</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-display font-bold text-sm uppercase tracking-wider mb-4">Comprar</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => openModal("comprar")} className={lnk}>Como comprar</button></li>
                <li><a href="/#catalogo" onClick={(e) => { e.preventDefault(); const el = document.getElementById('catalogo'); if (el) el.scrollIntoView({ behavior: 'smooth' }); else window.location.href = '/#catalogo'; }} className="text-xs hover:text-indigo-400 transition-colors">Catalogo</a></li>
                <li><a href="/#catalogo" onClick={(e) => { e.preventDefault(); const el = document.getElementById('catalogo'); if (el) el.scrollIntoView({ behavior: 'smooth' }); else window.location.href = '/#catalogo'; }} className="text-xs hover:text-indigo-400 transition-colors">Streaming</a></li>
                <li><a href="/#catalogo" onClick={(e) => { e.preventDefault(); const el = document.getElementById('catalogo'); if (el) el.scrollIntoView({ behavior: 'smooth' }); else window.location.href = '/#catalogo'; }} className="text-xs hover:text-indigo-400 transition-colors">Ofertas</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-display font-bold text-sm uppercase tracking-wider mb-4">Ayuda</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => openModal("faq")} className={lnk}>Preguntas frecuentes</button></li>
                <li><a href="https://wa.me/50237871216" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-indigo-400 transition-colors">Soporte WhatsApp</a></li>
                <li><button onClick={() => openModal("devoluciones")} className={lnk}>Politica de devoluciones</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-display font-bold text-sm uppercase tracking-wider mb-4">Negocios</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => openModal("vender")} className={lnk}>Vende con nosotros</button></li>
                <li><button onClick={() => openModal("anunciate")} className={lnk}>Anunciate</button></li>
                <li><button onClick={() => openModal("alianzas")} className={lnk}>Alianzas</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-display font-bold text-sm uppercase tracking-wider mb-4">Siguenos</h4>
              <div className="flex items-center gap-3 mb-4">
                <a href="https://www.facebook.com/share/1EAk4dnfj3/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-slate-800/80 hover:bg-indigo-500/20 hover:text-indigo-400 flex items-center justify-center transition-all">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="https://www.tiktok.com/@paudronix?_r=1&_t=ZS-94MERAhez8j" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-slate-800/80 hover:bg-indigo-500/20 hover:text-indigo-400 flex items-center justify-center transition-all">
                  <TikTokIcon className="w-4 h-4" />
                </a>
                <a href="https://wa.me/50237871216" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-slate-800/80 hover:bg-indigo-500/20 hover:text-indigo-400 flex items-center justify-center transition-all">
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
              <div className="space-y-2">
                <a href="mailto:paudronixgt@gmail.com" className="flex items-center gap-2 text-xs hover:text-indigo-400 transition-colors">
                  <Mail className="w-3.5 h-3.5" /> paudronixgt@gmail.com
                </a>
                <a href="https://wa.me/50237871216" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs hover:text-indigo-400 transition-colors">
                  <Phone className="w-3.5 h-3.5" /> +502 3787 1216
                </a>
                <p className="flex items-center gap-2 text-xs">
                  <MapPin className="w-3.5 h-3.5" /> Guatemala
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h4 className="text-white font-display font-bold text-sm uppercase tracking-wider mb-1">Recibe ofertas exclusivas</h4>
                <p className="text-xs text-slate-500">Suscribete y recibe las mejores ofertas en tu correo</p>
              </div>
              <form onSubmit={handleSubscribe} className="flex items-center w-full md:w-auto">
                <div className="relative flex items-center w-full md:w-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ingresa tu email"
                    className="w-full md:w-72 h-11 px-4 pr-28 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                    disabled={subscribeStatus === "loading"}
                  />
                  <button
                    type="submit"
                    disabled={subscribeStatus === "loading" || !email}
                    className="absolute right-1 h-9 px-4 rounded-lg text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5"
                    style={{ background: "linear-gradient(135deg,#6366f1,#6366f1)" }}
                  >
                    {subscribeStatus === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : subscribeStatus === "success" ? <><CheckCircle className="w-3.5 h-3.5" /> Listo</>
                      : <><Send className="w-3.5 h-3.5" /> Suscribirse</>}
                  </button>
                </div>
              </form>
            </div>
            {statusMessage && subscribeStatus !== "idle" && (
              <p className={`text-xs mt-2 ${subscribeStatus === "success" ? "text-green-400" : "text-red-400"}`}>{statusMessage}</p>
            )}
          </div>

          <div className="border-t border-slate-800/60 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <svg width="36" height="36" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <clipPath id="footer-badge-clip">
                    <rect width="52" height="52" rx="13"/>
                  </clipPath>
                </defs>
                <rect width="52" height="52" rx="13" fill="#1e293b"/>
                <polygon points="52,0 52,30 22,0" fill="#6366f1" clipPath="url(#footer-badge-clip)"/>
                <text x="7" y="38" fontFamily="Arial Black, sans-serif" fontSize="24" fontWeight="900" fill="white">PG</text>
                <rect x="7" y="43" width="22" height="3" rx="1.5" fill="#6366f1"/>
              </svg>
              <div className="flex flex-col leading-none">
                <span className="font-black text-sm text-white uppercase tracking-tight">
                  PAUDRONIX <span className="text-indigo-500">GT</span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Guatemala</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 text-center">
              Copyright &copy; {new Date().getFullYear()} PAUDRONIX GT. Todos los derechos reservados. Guatemala.
            </p>
            <div className="flex items-center gap-4 text-[10px]">
              <button onClick={() => openModal("politicas")} className="hover:text-indigo-400 transition-colors cursor-pointer bg-transparent border-none text-slate-400 text-[10px]">Terminos y Condiciones</button>
              <button onClick={() => openModal("privacidad")} className="hover:text-indigo-400 transition-colors cursor-pointer bg-transparent border-none text-slate-400 text-[10px]">Aviso de Privacidad</button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
