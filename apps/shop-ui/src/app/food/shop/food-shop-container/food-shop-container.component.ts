import { Component, OnInit } from '@angular/core';
import { FoodEntityService } from '../../state/food-entity.service';
import { CartItem } from '../cart-item.model';
import { CartFacade } from '../../state/cart/cart.facade';

@Component({
  selector: 'app-food-shop-contaiener',
  templateUrl: './food-shop-container.component.html',
  styleUrls: ['./food-shop-container.component.scss'],
})
export class FoodShopContaienerComponent implements OnInit {
  food = this.foodService.entities$;

  constructor(
    private foodService: FoodEntityService,
    private cart: CartFacade
  ) {}

  ngOnInit(): void {
    this.foodService.loaded$.subscribe((loaded) => {
      if (!loaded) {
        this.foodService.getAll();
      }
    });
  }

  handleChange(f: CartItem) {
    this.cart.set(f);
  }
}
