import { gql } from '@apollo/client';

// Queries
export const GET_EXHIBITIONS = gql`
  query GetExhibitions($status: ExhibitionStatus, $featured: Boolean) {
    exhibitions(status: $status, featured: $featured) {
      id
      slug
      name
      category
      description
      shortDescription
      durationMinutes
      capacity
      images
      status
      featured
      displayOrder
      createdAt
      updatedAt
      pricing {
        id
        ticketType
        price
        active
        validFrom
      }
    }
  }
`;

export const GET_EXHIBITION = gql`
  query GetExhibition($slug: String!) {
    exhibition(slug: $slug) {
      id
      slug
      name
      category
      description
      shortDescription
      durationMinutes
      capacity
      images
      status
      featured
      displayOrder
      createdAt
      updatedAt
      pricing {
        id
        ticketType
        price
        active
        validFrom
      }
    }
  }
`;

export const GET_SHOWS = gql`
  query GetShows($type: String) {
    shows(type: $type) {
      id
      slug
      name
      type
      description
      durationMinutes
      thumbnailUrl
      status
      createdAt
      pricing {
        id
        ticketType
        price
        active
        validFrom
      }
      timeSlots {
        id
        showId
        startTime
        endTime
        capacity
        active
      }
    }
  }
`;

export const GET_SHOW = gql`
  query GetShow($slug: String!) {
    show(slug: $slug) {
      id
      slug
      name
      type
      description
      durationMinutes
      thumbnailUrl
      status
      createdAt
      pricing {
        id
        ticketType
        price
        active
        validFrom
      }
      timeSlots {
        id
        showId
        startTime
        endTime
        capacity
        active
      }
    }
  }
`;

export const GET_AVAILABLE_TIME_SLOTS = gql`
  query GetAvailableTimeSlots($date: Date!, $exhibitionId: ID, $showId: ID) {
    availableTimeSlots(date: $date, exhibitionId: $exhibitionId, showId: $showId) {
      id
      showId
      startTime
      endTime
      capacity
      active
    }
  }
`;

export const GET_BOOKING = gql`
  query GetBooking($reference: String!) {
    booking(reference: $reference) {
      id
      bookingReference
      userId
      guestName
      guestEmail
      guestPhone
      exhibitionId
      showId
      bookingDate
      timeSlotId
      status
      paymentStatus
      totalAmount
      createdAt
      updatedAt
      tickets {
        id
        bookingId
        pricingId
        quantity
        pricePerTicket
        subtotal
        ticketType
      }
      seats {
        id
        bookingId
        seatNumber
        rowLetter
      }
    }
  }
`;

export const GET_MY_BOOKINGS = gql`
  query GetMyBookings {
    myBookings {
      id
      bookingReference
      userId
      guestName
      guestEmail
      guestPhone
      exhibitionId
      showId
      bookingDate
      timeSlotId
      status
      paymentStatus
      totalAmount
      createdAt
      updatedAt
      tickets {
        id
        bookingId
        pricingId
        quantity
        pricePerTicket
        subtotal
        ticketType
      }
      seats {
        id
        bookingId
        seatNumber
        rowLetter
      }
    }
  }
`;

export const GET_EVENTS = gql`
  query GetEvents($status: String) {
    events(status: $status) {
      id
      title
      slug
      description
      eventDate
      startTime
      endTime
      location
      maxParticipants
      registrationRequired
      featuredImage
      status
      createdAt
      registeredCount
    }
  }
`;

export const GET_EVENT = gql`
  query GetEvent($slug: String!) {
    event(slug: $slug) {
      id
      title
      slug
      description
      eventDate
      startTime
      endTime
      location
      maxParticipants
      registrationRequired
      featuredImage
      status
      createdAt
      registeredCount
    }
  }
`;

export const GET_PRICING = gql`
  query GetPricing($exhibitionId: ID, $showId: ID) {
    pricing(exhibitionId: $exhibitionId, showId: $showId) {
      id
      ticketType
      price
      active
      validFrom
    }
  }
`;

export const GET_BOOKED_SEATS = gql`
  query GetBookedSeats($showId: ID!, $date: Date!, $timeSlotId: ID!) {
    bookedSeats(showId: $showId, date: $date, timeSlotId: $timeSlotId)
  }
`;

// Mutations
export const CREATE_BOOKING = gql`
  mutation CreateBooking($input: CreateBookingInput!) {
    createBooking(input: $input) {
      id
      bookingReference
      userId
      guestName
      guestEmail
      guestPhone
      exhibitionId
      showId
      bookingDate
      timeSlotId
      status
      paymentStatus
      totalAmount
      createdAt
      updatedAt
      tickets {
        id
        bookingId
        pricingId
        quantity
        pricePerTicket
        subtotal
        ticketType
      }
      seats {
        id
        bookingId
        seatNumber
        rowLetter
      }
    }
  }
`;

export const CANCEL_BOOKING = gql`
  mutation CancelBooking($reference: String!) {
    cancelBooking(reference: $reference) {
      id
      bookingReference
      status
      paymentStatus
    }
  }
`;

export const REGISTER_FOR_EVENT = gql`
  mutation RegisterForEvent($input: EventRegistrationInput!) {
    registerForEvent(input: $input)
  }
`;

export const SUBSCRIBE_NEWSLETTER = gql`
  mutation SubscribeNewsletter($email: String!, $name: String) {
    subscribeNewsletter(email: $email, name: $name)
  }
`;

export const SUBMIT_CONTACT_FORM = gql`
  mutation SubmitContactForm($input: ContactFormInput!) {
    submitContactForm(input: $input)
  }
`;

// Admin Mutations
export const ADD_EXHIBITION = gql`
  mutation AddExhibition($input: String!) {
    addExhibition(input: $input) {
      id
      slug
      name
      category
      description
      shortDescription
      durationMinutes
      capacity
      images
      status
      featured
      displayOrder
      createdAt
      updatedAt
      pricing {
        id
        ticketType
        price
        active
        validFrom
      }
    }
  }
`;

export const UPDATE_EXHIBITION = gql`
  mutation UpdateExhibition($id: ID!, $input: String!) {
    updateExhibition(id: $id, input: $input) {
      id
      slug
      name
      category
      description
      shortDescription
      durationMinutes
      capacity
      images
      status
      featured
      displayOrder
      createdAt
      updatedAt
      pricing {
        id
        ticketType
        price
        active
        validFrom
      }
    }
  }
`;

export const DELETE_EXHIBITION = gql`
  mutation DeleteExhibition($id: ID!) {
    deleteExhibition(id: $id)
  }
`;

export const TOGGLE_EXHIBITION_FEATURED = gql`
  mutation ToggleExhibitionFeatured($id: ID!) {
    toggleExhibitionFeatured(id: $id) {
      id
      featured
    }
  }
`;

export const UPDATE_BOOKING_STATUS = gql`
  mutation UpdateBookingStatus($id: ID!, $status: BookingStatus!) {
    updateBookingStatus(id: $id, status: $status) {
      id
      bookingReference
      status
      paymentStatus
    }
  }
`;

















