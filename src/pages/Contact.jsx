
import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase.js'

const initialFormData = {
  name: '',
  email: '',
  subject: '',
  message: '',
}

const API_BASE_URL = 'http://127.0.0.1:8001'

function Contact() {
  const [formData, setFormData] = useState(initialFormData)
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [feedbackType, setFeedbackType] = useState('')

  const [contactInfo, setContactInfo] = useState({
    email: '',
    phone: '',
  })
  const [contactInfoLoading, setContactInfoLoading] = useState(true)

  useEffect(() => {
    const contactRef = doc(db, 'siteSettings', 'contact')

    const unsubscribe = onSnapshot(
      contactRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()

          setContactInfo({
            email: typeof data.email === 'string' ? data.email : '',
            phone: typeof data.phone === 'string' ? data.phone : '',
          })
        } else {
          setContactInfo({ email: '', phone: '' })
        }

        setContactInfoLoading(false)
      },
      (error) => {
        console.error('Could not load contact information:', error)
        setContactInfoLoading(false)
      }
    )

    return unsubscribe
  }, [])

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (sending) return

    setSending(true)
    setFeedback('')
    setFeedbackType('')

    let savedMessage = false

    try {
      const name = formData.name.trim()
      const email = formData.email.trim()
      const subject = formData.subject.trim()
      const message = formData.message.trim()

      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

      if (
        !name ||
        name.length > 100 ||
        !validEmail ||
        email.length > 254 ||
        !subject ||
        subject.length > 200 ||
        !message ||
        message.length > 5000
      ) {
        throw new Error('Please check your details and message length.')
      }

      const docRef = await addDoc(collection(db, 'contactMessages'), {
        name,
        email,
        subject,
        message,
        createdAt: serverTimestamp(),
        status: 'unread',
      })

      savedMessage = true
      setFormData(initialFormData)

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/contact-messages/notify`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message_id: docRef.id,
            }),
          }
        )

        if (!response.ok) {
          throw new Error('Notification request failed.')
        }

        setFeedback('Your message was sent successfully!')
        setFeedbackType('success')
      } catch (notificationError) {
        console.error(
          'Message saved, but email notification failed:',
          notificationError
        )

        setFeedback(
          'Your message was saved. Email notification could not be sent; please contact me directly if needed.'
        )
        setFeedbackType('error')
      }
    } catch (error) {
      console.error('Error saving contact message:', error)

      if (!savedMessage) {
        setFeedback(
          'Message could not be saved. Please check your details and try again.'
        )
        setFeedbackType('error')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="content-page">
      <section className="content-section">
        <p className="eyebrow">GET IN TOUCH</p>
        <h1>
          Let's <span>Connect</span>
        </h1>

        <p className="section-description">
          Have a project idea, internship opportunity or professional
          enquiry? Feel free to contact me.
        </p>
      </section>

      <section className="content-section alternate contact-grid">
        <div className="info-card">
          <h2>Contact Information</h2>

          {contactInfoLoading ? (
            <p>Loading contact information...</p>
          ) : (
            <>
              {contactInfo.email && (
                <p>
                  <strong>Email:</strong>{' '}
                  <a href={`mailto:${contactInfo.email}`}>
                    {contactInfo.email}
                  </a>
                </p>
              )}

              {contactInfo.phone && (
                <p>
                  <strong>Phone:</strong>{' '}
                  <a href={`tel:${contactInfo.phone}`}>
                    {contactInfo.phone}
                  </a>
                </p>
              )}

              {!contactInfo.email && !contactInfo.phone && (
                <p>Contact information will be updated soon.</p>
              )}
            </>
          )}

          <p>
            You can contact me regarding projects, learning,
            collaboration and career opportunities.
          </p>
        </div>

        <div className="info-card">
          <h2>Send a Message</h2>

          <form onSubmit={handleSubmit} className="contact-form">
            <label htmlFor="contact-name">Your Name</label>
            <input
              id="contact-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              maxLength={100}
              autoComplete="name"
              required
            />

            <label htmlFor="contact-email">Your Email</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              maxLength={254}
              autoComplete="email"
              required
            />

            <label htmlFor="contact-subject">Subject</label>
            <input
              id="contact-subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Enter the subject"
              maxLength={200}
              required
            />

            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Write your message"
              rows={5}
              maxLength={5000}
              required
            />

            <button
              type="submit"
              className="primary-btn"
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>

            {feedback && (
              <p
                role="status"
                aria-live="polite"
                data-feedback-type={feedbackType}
              >
                {feedback}
              </p>
            )}
          </form>
        </div>
      </section>
    </main>
  )
}

export default Contact
