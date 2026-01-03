import { useForm } from 'react-hook-form@7.55.0';
import { User, Mail, Phone, MapPin, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface StudentFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  
  // Address Information
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Academic Information
  gradeLevel: string;
  previousSchool: string;
  startDate: string;
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  
  // Medical Information
  medicalConditions: string;
  allergies: string;
}

export function StudentRegistrationForm() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<StudentFormData>();

  const onSubmit = (data: StudentFormData) => {
    console.log('Form Data:', data);
    toast.success('Registration submitted successfully!');
    reset();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-gray-900">Personal Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                {...register('firstName', { required: 'First name is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                {...register('lastName', { required: 'Last name is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.lastName.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="student@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="phone"
                  type="tel"
                  {...register('phone', { required: 'Phone number is required' })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="(123) 456-7890"
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-gray-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="dateOfBirth"
                  type="date"
                  {...register('dateOfBirth', { required: 'Date of birth is required' })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
              {errors.dateOfBirth && (
                <p className="text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="gender" className="block text-gray-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                {...register('gender', { required: 'Gender is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.gender.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h2 className="text-gray-900">Address Information</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="streetAddress" className="block text-gray-700 mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                id="streetAddress"
                type="text"
                {...register('streetAddress', { required: 'Street address is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="123 Main Street"
              />
              {errors.streetAddress && (
                <p className="text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.streetAddress.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  {...register('city', { required: 'City is required' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="City"
                />
                {errors.city && (
                  <p className="text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.city.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="state" className="block text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  id="state"
                  type="text"
                  {...register('state', { required: 'State is required' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="State"
                />
                {errors.state && (
                  <p className="text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.state.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="zipCode" className="block text-gray-700 mb-1">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="zipCode"
                  type="text"
                  {...register('zipCode', { required: 'ZIP code is required' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="12345"
                />
                {errors.zipCode && (
                  <p className="text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.zipCode.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="country" className="block text-gray-700 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                id="country"
                type="text"
                {...register('country', { required: 'Country is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Country"
              />
              {errors.country && (
                <p className="text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.country.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Academic Information Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-gray-900">Academic Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gradeLevel" className="block text-gray-700 mb-1">
                Grade Level <span className="text-red-500">*</span>
              </label>
              <select
                id="gradeLevel"
                {...register('gradeLevel', { required: 'Grade level is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              >
                <option value="">Select grade level</option>
                <option value="kindergarten">Kindergarten</option>
                <option value="1">1st Grade</option>
                <option value="2">2nd Grade</option>
                <option value="3">3rd Grade</option>
                <option value="4">4th Grade</option>
                <option value="5">5th Grade</option>
                <option value="6">6th Grade</option>
                <option value="7">7th Grade</option>
                <option value="8">8th Grade</option>
                <option value="9">9th Grade (Freshman)</option>
                <option value="10">10th Grade (Sophomore)</option>
                <option value="11">11th Grade (Junior)</option>
                <option value="12">12th Grade (Senior)</option>
              </select>
              {errors.gradeLevel && (
                <p className="text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.gradeLevel.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="startDate" className="block text-gray-700 mb-1">
                Intended Start Date <span className="text-red-500">*</span>
              </label>
              <input
                id="startDate"
                type="date"
                {...register('startDate', { required: 'Start date is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              {errors.startDate && (
                <p className="text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="previousSchool" className="block text-gray-700 mb-1">
                Previous School
              </label>
              <input
                id="previousSchool"
                type="text"
                {...register('previousSchool')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Name of previous school (if applicable)"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-gray-900">Emergency Contact</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="emergencyContactName" className="block text-gray-700 mb-1">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                id="emergencyContactName"
                type="text"
                {...register('emergencyContactName', { required: 'Emergency contact name is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Full name"
              />
              {errors.emergencyContactName && (
                <p className="text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.emergencyContactName.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="emergencyContactRelation" className="block text-gray-700 mb-1">
                Relationship <span className="text-red-500">*</span>
              </label>
              <input
                id="emergencyContactRelation"
                type="text"
                {...register('emergencyContactRelation', { required: 'Relationship is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="e.g., Parent, Guardian"
              />
              {errors.emergencyContactRelation && (
                <p className="text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.emergencyContactRelation.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="emergencyContactPhone" className="block text-gray-700 mb-1">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                id="emergencyContactPhone"
                type="tel"
                {...register('emergencyContactPhone', { required: 'Emergency contact phone is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="(123) 456-7890"
              />
              {errors.emergencyContactPhone && (
                <p className="text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.emergencyContactPhone.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Medical Information Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-gray-900">Medical Information</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="medicalConditions" className="block text-gray-700 mb-1">
                Medical Conditions
              </label>
              <textarea
                id="medicalConditions"
                {...register('medicalConditions')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                placeholder="List any medical conditions we should be aware of (optional)"
              />
            </div>

            <div>
              <label htmlFor="allergies" className="block text-gray-700 mb-1">
                Allergies
              </label>
              <textarea
                id="allergies"
                {...register('allergies')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                placeholder="List any allergies (optional)"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Reset Form
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Submit Registration
          </button>
        </div>
      </form>
    </div>
  );
}
