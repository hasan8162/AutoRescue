import logo from "../assets/autoRescue.png"

function Navbar() {
  return (
    <nav className="w-full px-6 py-2 shadow-lg">
        <div className="max-w-7xl mx-auto flex gap-4">
           <img src={logo} alt="logo" className="h-8 mt-1"/>
           <div className="text-2xl font-bold"><span className="text-red-600">Auto</span>Rescue</div>
        </div>
    </nav>
  )
}
export default Navbar