import bcrypt from 'bcrypt';

const validPassword = async() => { console.log(await bcrypt.hash('Setup@123', 12));}
validPassword();
