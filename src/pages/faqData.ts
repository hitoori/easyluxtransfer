export const faqTopics = [
  { id: 'booking', title: 'Booking & Payment', questions: [
    { id: 'book', q: 'Does sending a request book my transfer?', a: 'No. We’ll check availability and send you a quote. Your booking is confirmed after agreement of the details and receipt of the deposit.' },
    { id: 'price', q: 'Will I pay the price shown on the website?', a: 'The prices shown are indicative. We’ll confirm the fare for your route, vehicle and travel date before you book.' },
    { id: 'payment', q: 'Do I need to pay a deposit?', a: 'A deposit is required to confirm your booking. We’ll tell you the amount, how to pay it and when the balance is due before you confirm.' },
    { id: 'modify', q: 'Can I change my pick-up time or destination after booking?', a: 'Tell us what needs to change as soon as you can. We’ll check availability and let you know if it affects the price.' },
    { id: 'cancel', q: 'What happens if I need to cancel?', a: 'Contact us as soon as your plans change. Any cancellation fee or refund depends on the terms agreed for your booking.' },
  ] },
  { id: 'journey', title: 'Pick-up & Journey', questions: [
    { id: 'port', q: 'Can you pick us up from a hotel, train station or cruise terminal?', a: 'Yes. Send us the address or station name. For a cruise pick-up, include your ship, terminal and disembarkation time so we can agree on a meeting point.' },
    { id: 'bags', q: 'Will all our luggage fit?', a: 'Tell us how many people and bags are travelling. Mention large suitcases, skis or pushchairs so we can confirm a suitable vehicle.' },
    { id: 'child', q: 'Can you provide a child seat?', a: 'Tell us each child’s age and size when requesting a quote. We’ll confirm the suitable seat, availability and any charge.' },
  ] },
  { id: 'airport', title: 'Airport & Water Taxi', questions: [
    { id: 'meeting', q: 'Where do I meet the driver when I land?', a: 'Your driver will meet you in Arrivals after baggage claim, with your name displayed. We’ll send you the exact meeting instructions before you travel.' },
    { id: 'delay', q: 'What if my flight is delayed?', a: 'Give us your flight number so we can follow its arrival and adjust the pick-up time. If your flight number changes, let us know.' },
    { id: 'cancelled-flight', q: 'What if my flight is cancelled?', a: 'Message us as soon as you know. If you have a replacement flight, send us its details and we’ll check a new pick-up time. Any fees or refund depend on your booking terms.' },
    { id: 'hotel', q: 'Can the car take us all the way to our hotel in Venice?', a: 'Not if the hotel can’t be reached by road. Send us its address and we’ll tell you where the car can take you and whether you’ll need a water taxi.' },
    { id: 'combine', q: 'How do the car and water taxi connect?', a: 'For a Marco Polo Airport arrival, your driver takes you to Piazzale Roma. From there, a private water taxi takes you to your hotel or the nearest accessible landing. We can arrange the journey in reverse too.' },
    { id: 'boat-price', q: 'Is the water taxi included in the car price?', a: 'No. The site currently lists the private car from €80 and the water taxi at €100–140. We’ll confirm the price of your complete journey before you book.' },
  ] },
  { id: 'distance', title: 'Long-distance & Hourly', questions: [
    { id: 'hourly', q: 'Can we keep the driver for a few hours?', a: 'Yes. Hourly chauffeur service starts at two hours. Tell us roughly how long you need the driver and where you plan to stop.' },
    { id: 'return', q: 'Can we book a return transfer?', a: 'Yes. Include the dates and pick-up times for both journeys when requesting a quote. Each direction is priced separately.' },
    { id: 'stops', q: 'Can we stop somewhere on the way?', a: 'Yes. Tell us your planned stops when requesting a quote so we can include the time and route in the price.' },
    { id: 'europe', q: 'Can you take us from Venice to another country?', a: 'Yes. We arrange private journeys to destinations in Austria, Slovenia, Croatia and France. Send us your exact route for a quote.' },
    { id: 'prosecco', q: 'Does a Prosecco Hills transfer include winery tastings?', a: 'No. Easy Lux provides the private transfer. Winery visits, tastings and guided tours are not included. Tell us if you need waiting time or a return pick-up.' },
  ] },
  { id: 'general', title: 'Special requests', questions: [
    { id: 'access', q: 'Can I travel with a wheelchair or mobility aid?', a: 'Tell us what assistance you need and whether you need to remain in your wheelchair during the journey. Include the equipment’s dimensions so we can check whether suitable transport is available before you book.' },
    { id: 'pets', q: 'Can I bring my dog or another pet?', a: 'Tell us the animal’s size and whether it will travel in a carrier. We’ll check the arrangements with you before confirming the booking. Mention an assistance dog when you contact us.' },
  ] },
] as const
