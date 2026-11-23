import Carta from '../repositories/CartaRepository.js'
import { paquetes } from '../repositories/CatalogoRepository.js'
export default {
  listar() {
    return [
      ...Carta.findAll().filter((item) => item.disponible),
      ...paquetes
        .findAll()
        .filter((item) => item.activo && item.precio > 0)
        .map((item) => ({
          id: `combo-${item.id}`,
          name: item.nombre,
          price: item.precio,
          category: 'Combos',
          character: 'Para compartir en tu mesa.',
          description: item.descripcion,
          ingredients: item.descripcion,
          image: item.imagen || 'bar',
          alt: 'Imagen de ambientación de coctelería',
          disponible: true,
        })),
    ]
  },
}
